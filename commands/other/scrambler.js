const discord = require("discord.js");
const { Command } = require("../../utils");
const { Alphabets, encrypt, decrypt } = require("./libs/ScrambleLib");

const Scrambler = new Command("scrambler", "Scrambler");
Scrambler.setSlashAction(async (interact, bot) => {
  const param = interact.options.getString("parameter");
  const alphabet = interact.options.getString("alphabet");
  const query = interact.options.getString("query");
  if (param === "encrypt")
    return interact.reply({
      content: `Текст \`${query}\` успешно зашифрован.\nРезультат: \`${encrypt(
        query,
        Alphabets[alphabet]
      )}\`\nАлфавит: \`${alphabet}\``,
      ephemeral: true,
    });
  if (param === "decrypt")
    return interact.reply({
      content: `Шифр \`${query}\` успешно расшифрован.\nРезультат: \`${decrypt(
        query,
        Alphabets[alphabet]
      )}\`\nАлфавит: \`${alphabet}\``,
      ephemeral: true,
    });
}).slashCommandInfo
  .setDescription("Шифрует вам ебало.")
  .addStringOption((o) =>
    o
      .setName("parameter")
      .setDescription("Параметр")
      .setChoices(
        { name: "Зашифровать", value: "encrypt" },
        { name: "Расшифровать", value: "decrypt" }
      )
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("alphabet")
      .setDescription("Алфавит для действий")
      .setChoices(
        { name: "Где ёж", value: "default" },
        { name: "Алфавит Murka124", value: "murka124" },
        { name: "Похожий на реальный", value: "reallike" },
        { name: "Все", value: "all" }
      )
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("query")
      .setDescription("То что будет (рас)шифровываться")
      .setRequired(true)
  )

module.exports = Scrambler;
// module.exports = {
//   data: new discord.SlashCommandBuilder()
//     .setName("scrambler")
//     .setDescription("Шифрует вам ебало.")
//     .addStringOption((o) =>
//       o
//         .setName("parameter")
//         .setDescription("Параметр")
//         .setChoices(
//           { name: "Зашифровать", value: "encrypt" },
//           { name: "Расшифровать", value: "decrypt" }
//         )
//         .setRequired(true)
//     )
//     .addStringOption((o) =>
//       o
//         .setName("alphabet")
//         .setDescription("Алфавит для действий")
//         .setChoices(
//           { name: "Где ёж", value: "default" },
//           { name: "Алфавит Murka124", value: "murka124" },
//           { name: "Похожий на реальный", value: "reallike" },
//           { name: "Все", value: "all" }
//         )
//         .setRequired(true)
//     )
//     .addStringOption((o) =>
//       o
//         .setName("query")
//         .setDescription("То что будет (рас)шифровываться")
//         .setRequired(true)
//     ),
//   /**@param {discord.Interaction} interact @param {discord.Client} bot*/
//   async exec(interact, bot) {
//     const param = interact.options.getString("parameter");
//     const alphabet = interact.options.getString("alphabet");
//     const query = interact.options.getString("query");
//     if (param === "encrypt")
//       return interact.reply({
//         content: `Текст \`${query}\` успешно зашифрован.\nРезультат: \`${encrypt(
//           query,
//           alphabets[alphabet]
//         )}\`\nАлфавит: \`${alphabet}\``,
//         ephemeral: true,
//       });
//     if (param === "decrypt")
//       return interact.reply({
//         content: `Шифр \`${query}\` успешно расшифрован.\nРезультат: \`${decrypt(
//           query,
//           alphabets[alphabet]
//         )}\`\nАлфавит: \`${alphabet}\``,
//         ephemeral: true,
//       });
//   },
// };
