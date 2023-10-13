const discord = require("discord.js");
const alphabets = {
  default:
    'qwertyuiopasdfghjklzxcvbnm1234567890где ёж_сукайцншщзхъфывпролэячмитьбю.,?/""\\*-+~!@#%*()-+;:`[]{}',
  murka124: ` abcdefghijklmnopqrstuvwxyz0123456789абвгдеёжзийклмнопрстуфхцчшщъыьэюя[{'":;<,>./?|\=+-_)(*&^%$#№@!`,
  reallike:
    'абвгдеёжзийклмнопрстуфхцчщъыьэюя 1234567890abcdefghijklmnopqrstuvwxyz.,?/""*-+~!@#%*()_-+;:`[]{}~',
  all: "all",
};

/**@param { string } input @param { string } alphabetname */
const decrypt = (input, alphabet) => {
  let decrypted = "";
  for (let i = 0; i < input.length; i += 2) {
    decrypted += alphabet.charAt(
      parseInt(input.charAt(i) + input.charAt(i + 1)) - 1
    );
    // console.log(
    //   input.charAt(i) +
    //     input.charAt(i + 1) +
    //     " converted to " +
    //     alphabet.charAt(parseInt(input.charAt(i) + input.charAt(i + 1)))
    // );
  }
  return decrypted;
};

/**@param { string } input @param { string } alphabetname */
const encrypt = (input, alphabet) => {
  if (alphabet === "all") {
  }
  input = input.toLowerCase();
  let encrypted = "";
  for (let a = 0; a < input.length; a++) {
    for (let i = 0; i < alphabet.length; i++) {
      if (input.charAt(a) === alphabet.charAt(i)) {
        if (i + 1 < 10) encrypted += "0" + (i + 1);
        //console.log(`converted "${i+1}" to "0${i+1}"`)}
        else encrypted += "" + (i + 1);
        //console.log(`encrypted ${input.charAt(a)} as ${i+1}`)
      }
    }
  }
  return encrypted;
};

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("scrambler")
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
    ),
  /**@param {discord.Interaction} interact @param {discord.Client} bot*/
  async exec(interact, bot) {
    const param = interact.options.getString("parameter");
    const alphabet = interact.options.getString("alphabet");
    const query = interact.options.getString("query");
    if (param === "encrypt")
      return interact.reply({
        content: `Текст \`${query}\` успешно зашифрован.\nРезультат: \`${encrypt(
          query,
          alphabets[alphabet]
        )}\`\nАлфавит: \`${alphabet}\``,
        ephemeral: true,
      });
    if (param === "decrypt")
      return interact.reply({
        content: `Шифр \`${query}\` успешно расшифрован.\nРезультат: \`${decrypt(
          query,
          alphabets[alphabet]
        )}\`\nАлфавит: \`${alphabet}\``,
        ephemeral: true,
      });
  },
};
