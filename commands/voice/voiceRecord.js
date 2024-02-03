const discord = require("discord.js");
const dvoice = require("@discordjs/voice");
const { OpusEncoder } = require("@discordjs/opus");
const fs = require("fs"),
  path = require("path");
const Command = require("../../utils/Command");

const voiceRecord = new Command("voicerecord", "voiceRecord");
voiceRecord.slashCommandInfo
  .setDescription("Records Voice Channel.")
  .addChannelOption((o) =>
    o
      .setName("targetchannel")
      .setDescription("Voice channel, that will be recorded.")
      .addChannelTypes(
        discord.ChannelType.GuildVoice,
        discord.ChannelType.GuildStageVoice
      )
      .setRequired(true)
  );

voiceRecord.setSlashAction(async (interact, client) => {
  const channel = interact.options.getChannel("targetchannel");
  const testchannel = discord.BaseGuildVoiceChannel.prototype;

  const channelData = await channel.fetch();
  const membersCount = channelData.members.size;
  const voiceNotEmpty = membersCount > 0;
  await interact.reply("In voice channel: " + membersCount);
  if (!voiceNotEmpty) return;

  const connection = dvoice.joinVoiceChannel({
    selfDeaf: false,
    guildId: channel.guildId,
    channelId: channel.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  voiceRecord.logger.info(
    "Connected to",
    `"${channel.name}" (${channel.id}).`,
    "Bitrate:",
    channel.bitrate,
    "Members:",
    membersCount
  );

  const receiver = connection.receiver;

  const users = [];

  receiver.speaking.on("start", async (uid) => {
    if (users.includes(uid)) return;

    const user = channel.guild.members.cache.get(uid).user.username;
    const dir = voiceRecord.getDataDir("kot.voiceRecord");

    const userpath = path.join(dir, user);
    if (!fs.existsSync(userpath)) fs.mkdirSync(userpath, { recursive: true });
    const file = fs.createWriteStream(
      path.join(userpath, `audio_${Date.now()}_48000.pcm`)
    );
    const encoder = new OpusEncoder(48000, 1);

    const stream = receiver.subscribe(uid, { autoDestroy: false });
    stream.on("data", (chunk) => {
      file.write(encoder.decode(chunk));
    });
    users.push(uid);
  });
});

module.exports = voiceRecord;
