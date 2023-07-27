const { REST, Routes } = require("discord.js");
const fs = require("node:fs"),
  path = require("path");
const config = require("./config.json").bot;
const guildId = process.argv.slice(2)[0] ?? config.guildId;
const { clientId, token } = config;

const commands = [];
const commandFiles = [];

const resolvedir = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.lstatSync(filepath);
    if (stat.isFile() && file.endsWith(".js"))
      return commandFiles.push(filepath);
    else if (stat.isDirectory() && !file.endsWith(".ignore"))
      return resolvedir(filepath);
  });
};
resolvedir(path.join(__dirname, "./commands"));
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const command = require(file);
  if (!command.idata) return;
  commands.push(command.idata.toJSON());
  console.log(path.basename(file), "успешно загружен.");
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
    process.exit();
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
