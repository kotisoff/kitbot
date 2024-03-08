const discord = require("discord.js");
const dvoice = require("@discordjs/voice");
const { OpusEncoder } = require("@discordjs/opus");
const fs = require("fs"),
  path = require("path");
const Command = require("../../core/Command");

const voiceRecord = new Command("voicerecord", "voiceRecord");

const logger = voiceRecord.logger;

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
  )
  .addStringOption((o) =>
    o
      .setName("option")
      .setDescription("Additional option.")
      .setChoices(
        { name: "Leave", value: "leave" },
        { name: "Toggle recording of yourself", value: "toggleuser" }
      )
  );

/** @param { discord.VoiceChannel } channel @param { string } uid */
const getUser = async (uid, channel) =>
  (await channel.fetch()).members.get(uid)?.user;

class userMap extends Map {
  constructor() {
    super();
  }
  /** @returns { fs.WriteStream } @param { string } key */
  get = (key) => super.get(key);
  /** @param { string } key @param { fs.WriteStream } value */
  set = (key, value) => super.set(key, value);
}

const dataDir = voiceRecord.getDataDir("kot.voiceRecord");

voiceRecord.tempData.bannedUsers = [];
const bannedUsers = voiceRecord.tempData.bannedUsers;
const isUserBanned = (uid) => bannedUsers.filter((v) => v == uid).length > 0;
const banUser = (uid) => bannedUsers.push(uid);
const unbanUser = (uid) => bannedUsers.splice(bannedUsers.indexOf(uid), 1);
const toggleUserBan = (uid) =>
  isUserBanned(uid) ? unbanUser(uid) : banUser(uid);

voiceRecord.setSlashAction(async (interact, client) => {
  let channel = discord.VoiceChannel.prototype;
  channel = interact.options.getChannel("targetchannel");
  const option = interact.options.getString("option");

  if (option == "leave") {
    const connection = dvoice.getVoiceConnection(channel.guildId);
    if (!connection) return interact.reply("Bot is not in voice channel!");
    connection.destroy();
    return interact.reply("Disconnected from voice channel.");
  }
  if (option == "toggleuser") {
    const connection = dvoice.getVoiceConnection(channel.guildId);
    if (!connection) return interact.reply("Bot is not in voice channel!");
    const uid = interact.user.id;
    if (!(await channel.fetch()).members.has(uid))
      return interact.reply("You are not in voice channel!");
    toggleUserBan(uid);
    return interact.reply(
      `Bot ${isUserBanned(uid) ? "is **NOT**" : "**is**"} recording you.` //небольшая поправочка. если пользователь находится в бане, его НЕ записывают.
    );
  }

  const membersCount = (await channel.fetch()).members.size;
  const voiceNotEmpty = membersCount > 0;
  await interact.reply("In voice channel: " + membersCount);
  if (!voiceNotEmpty) return;

  const connection = dvoice.joinVoiceChannel({
    selfDeaf: false,
    guildId: channel.guildId,
    channelId: channel.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  logger.info(
    "Connected to",
    `"${channel.name}" (${channel.id}).`,
    "Bitrate:",
    channel.bitrate,
    "Members:",
    membersCount
  );

  const users = new userMap();

  const receiver = connection.receiver;

  receiver.speaking.on("start", async (uid) => {
    const user = (await getUser(uid, channel))?.username;
    if (!user) return;

    const currentDate = new Date();
    const date = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    const userpath = path.join(
      dataDir,
      channel.guildId,
      channel.id,
      date,
      user
    );

    if (!fs.existsSync(userpath)) fs.mkdirSync(userpath, { recursive: true });
    users.get(uid)?.close();
    if (isUserBanned(uid)) return;
    users.set(
      uid,
      fs.createWriteStream(path.join(userpath, `voice_${Date.now()}.pcm`))
    );

    if (receiver.subscriptions.has(uid)) return;

    const encoder = new OpusEncoder(48000, 1);

    const stream = receiver.subscribe(uid);

    stream.on("data", (chunk) => {
      if (isUserBanned(uid)) return;
      const file = users.get(uid);
      const data = encoder.decode(chunk);
      file.write(data);
    });
  });
});

module.exports = voiceRecord;
