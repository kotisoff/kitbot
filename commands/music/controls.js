const discord = require("discord.js"),
  discordp = require("discord-player");
const Command = require("../../utils/Command");

const Music = new Command("music", "MusicControls")
Music.setSlashAction(async (interact, bot) => {
  const param = await interact.options.getString("param");
  if (!param) return interact.reply("А если подумать?");
  if (param === "skip") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    queue.node.skip();
    const track = queue.currentTrack;
    return await interact.editReply(
      `Трек \`${track.title} - ${track.author}\` пропущен.`
    );
  } else if (param === "pause") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    if (queue.node.isPaused()) {
      queue.node.setPaused(false);
      interact.editReply("Воспроизведение продолжено.");
    } else {
      queue.node.setPaused(true);
      interact.editReply("Воспроизведение приостановлено.");
    }
  } else if (param === "current") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    if (!queue)
      return await interact.editReply("Сейчас ничего не проигрывается!");
    const track = queue.currentTrack;
    return await interact.editReply(
      `Текущий трек: \`${track.title} - ${track.author
      }\` ${queue.node.createProgressBar()}`
    );
  } else if (param === "list") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    const tracks = [queue.currentTrack].concat(queue.tracks.data);
    let out = `Список воспроизведения (Всего: ${tracks.length}):\n${tracks
      .map(
        (track) =>
          `${tracks.indexOf(track) + 1}. \`${track.title} - ${track.author
          }\` requested by @${track.requestedBy.username}`
      )
      .join("\n")}`;
    if (out.length > 2000)
      return interact.editReply(out.substring(0, 1980) + `\nAnd more...`);
    interact.editReply(out);
  } else if (param === "stop") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    if (!queue)
      return await interact.editReply("Сейчас ничего не проигрывается!");
    queue.delete();
    await interact.editReply("Плейлист остановлен.");
  } else if (param === "eq") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    if (!queue)
      return await interact.editReply("Сейчас ничего не проигрывается!");
    const eq = await interact.options.getString("eqsetups");
    if (!eq)
      return await interact.reply(
        "Не выбран пресет эквалайзера для переключения!"
      );
    await queue.filters.ffmpeg.toggle([eq]);
    await interact.editReply(
      `Фильтр ${eq} переключён на ${queue.filters.ffmpeg.isEnabled(eq)}.`
    );
  } else if (param === "shuffle") {
    await interact.reply("*Думоет...*");
    const queue = discordp.useQueue(interact.guildId);
    if (!queue)
      return await interact.editReply("Сейчас ничего не проигрывается!");
    queue.tracks.shuffle()
    await interact.editReply("Треки перемешаны.");
  }
}).slashCommandInfo
  .setDescription("Music controls.")
  .addStringOption((o) =>
    o
      .setName("param")
      .setDescription("Parameter")
      .addChoices(
        { name: "Пропустить", value: "skip" },
        { name: "Пауза", value: "pause" },
        { name: "Текущий трек", value: "current" },
        { name: "Список воспроизведения", value: "list" },
        { name: "Перемешать", value: "shuffle" },
        { name: "Остановить", value: "stop" },
        { name: "Эквалайзер", value: "eq" }
      )
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("eqsetups")
      .setDescription("Настройки эквалайзера")
      .addChoices(
        { name: "BassBoost", value: "bassboost" },
        { name: "NightCore", value: "nightcore" }
      )
  )
module.exports = Music;
// module.exports = {
//   data: new discord.SlashCommandBuilder()
//     .setName("music")
//     .setDescription("Music controls.")
//     .addStringOption((o) =>
//       o
//         .setName("param")
//         .setDescription("Parameter")
//         .addChoices(
//           { name: "Пропустить", value: "skip" },
//           { name: "Пауза", value: "pause" },
//           { name: "Текущий трек", value: "current" },
//           { name: "Список воспроизведения", value: "list" },
//           { name: "Перемешать", value: "shuffle" },
//           { name: "Остановить", value: "stop" },
//           { name: "Эквалайзер", value: "eq" }
//         )
//         .setRequired(true)
//     )
//     .addStringOption((o) =>
//       o
//         .setName("eqsetups")
//         .setDescription("Настройки эквалайзера")
//         .addChoices(
//           { name: "BassBoost", value: "bassboost" },
//           { name: "NightCore", value: "nightcore" }
//         )
//     ),
//   /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//   async exec(interact, bot) {
//     const param = await interact.options.getString("param");
//     if (!param) return interact.reply("А если подумать?");
//     if (param === "skip") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       queue.node.skip();
//       const track = queue.currentTrack;
//       return await interact.editReply(
//         `Трек \`${track.title} - ${track.author}\` пропущен.`
//       );
//     } else if (param === "pause") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       if (queue.node.isPaused()) {
//         queue.node.setPaused(false);
//         interact.editReply("Воспроизведение продолжено.");
//       } else {
//         queue.node.setPaused(true);
//         interact.editReply("Воспроизведение приостановлено.");
//       }
//     } else if (param === "current") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       if (!queue)
//         return await interact.editReply("Сейчас ничего не проигрывается!");
//       const track = queue.currentTrack;
//       return await interact.editReply(
//         `Текущий трек: \`${track.title} - ${track.author
//         }\` ${queue.node.createProgressBar()}`
//       );
//     } else if (param === "list") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       const tracks = [queue.currentTrack].concat(queue.tracks.data);
//       let out = `Список воспроизведения (Всего: ${tracks.length}):\n${tracks
//         .map(
//           (track) =>
//             `${tracks.indexOf(track) + 1}. \`${track.title} - ${track.author
//             }\` requested by @${track.requestedBy.username}`
//         )
//         .join("\n")}`;
//       if (out.length > 2000)
//         return interact.editReply(out.substring(0, 1980) + `\nAnd more...`);
//       interact.editReply(out);
//     } else if (param === "stop") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       if (!queue)
//         return await interact.editReply("Сейчас ничего не проигрывается!");
//       queue.delete();
//       await interact.editReply("Плейлист остановлен.");
//     } else if (param === "eq") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       if (!queue)
//         return await interact.editReply("Сейчас ничего не проигрывается!");
//       const eq = await interact.options.getString("eqsetups");
//       if (!eq)
//         return await interact.reply(
//           "Не выбран пресет эквалайзера для переключения!"
//         );
//       await queue.filters.ffmpeg.toggle([eq]);
//       await interact.editReply(
//         `Фильтр ${eq} переключён на ${queue.filters.ffmpeg.isEnabled(eq)}.`
//       );
//     } else if (param === "shuffle") {
//       await interact.reply("*Думоет...*");
//       const queue = discordp.useQueue(interact.guildId);
//       if (!queue)
//         return await interact.editReply("Сейчас ничего не проигрывается!");
//       queue.tracks.shuffle()
//       await interact.editReply("Треки перемешаны.");
//     }
//   },
// };
