const discord = require("discord.js");
const dvoice = require("@discordjs/voice");
const Stream = require("stream");
const Command = require("../../utils/Command");
const { randomBytes } = require("crypto");

const voiceBridge = new Command("voicebridge", "voiceBridge");
voiceBridge.slashCommandInfo
  .setDescription("Connects few voice channel.")
  .addStringOption((o) =>
    o
      .setName("option")
      .setDescription("Option.")
      .addChoices(
        {
          name: "Create room",
          value: "create"
        },
        { name: "Join room", value: "join" }
      )
      .setRequired(true)
  )
  .addChannelOption((o) =>
    o
      .setName("targetchannel")
      .setDescription("Voice channel, that will be connected.")
      .addChannelTypes(
        discord.ChannelType.GuildVoice,
        discord.ChannelType.GuildStageVoice
      )
      .setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("roomcode").setDescription("Code for joining to room.")
  );

class roomStream extends Stream.Readable {
  _read = () => {};
  constructor(options) {
    super({ ...options, objectMode: true });
  }
}

const rooms = [
  { code: "0", channels: [""], admins: [""], stream: roomStream.prototype }
];
rooms.length = 0;

const handleConnection = async (
  room = rooms[0],
  connection = dvoice.VoiceConnection.prototype,
  channel = discord.VoiceChannel.prototype
) => {
  const receiver = connection.receiver;
  const speaking = receiver.speaking;

  speaking.on("start", async (uid) => {
    if (receiver.subscriptions.has(uid)) return;
    const stream = receiver.subscribe(uid);
    stream.on("data", (chunk) => {
      room.stream.push(JSON.stringify({ channelid: channel.id, data: chunk }));
    });
  });

  room.stream.on("data", async (chunk) => {
    const data = JSON.parse(chunk);
    if (data.channelid == channel.id) return;
    connection.playOpusPacket(Buffer.from(data.data));
  });
};

voiceBridge.setSlashAction(async (interact, client) => {
  const option = interact.options.getString("option");
  const channel = interact.options.getChannel("targetchannel");
  const code = interact.options.getString("roomcode");

  const channelData = await channel.fetch();
  const membersCount = channelData.members.size;
  const voiceNotEmpty = membersCount > 0;
  await interact.reply("In voice channel: " + membersCount);
  if (!voiceNotEmpty) return interact.followUp("Nobody is in voice channel!");

  const connect = () => {
    voiceBridge.logger.info(
      "Connecting to",
      `"${channel.name}" (${channel.id}).`
    );
    return dvoice.joinVoiceChannel({
      selfDeaf: false,
      selfMute: false,
      guildId: channel.guildId,
      channelId: channel.id,
      adapterCreator: channel.guild.voiceAdapterCreator
    });
  };

  if (option == "create") {
    const generateCode = () => randomBytes(4).toString("hex");
    let tempCode = generateCode();
    while (rooms.filter((r) => r.code == tempCode).length) {
      tempCode = generateCode();
    }
    const room = {
      code: tempCode,
      channels: [channel.id],
      admins: [interact.user.id],
      stream: new roomStream()
    };
    await interact.followUp("Hosting new room. Code: " + room.code);
    voiceBridge.logger.info(
      `Created new room (${room.code}) in ${channel.name} (${channel.id})`
    );
    rooms.push(room);

    const connection = connect();
    handleConnection(room, connection, channel);
  } else if (option == "join") {
    const room = rooms.filter((room) => room.code == code)[0];
    if (!room) return await interact.followUp("No room with your code found.");
    await interact.followUp("Connected to room.");
    voiceBridge.logger.info(
      `${channel.name} (${channel.id}) connected to room (${room.code}). At the moment in room: ${room.channels.join()} (${room.channels.length} channels).`
    );

    const connection = connect();
    handleConnection(room, connection, channel);
  }
});

module.exports = voiceBridge;
