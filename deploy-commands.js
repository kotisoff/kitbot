const { REST, Routes } = require("discord.js");
const fs = require("node:fs"),
  path = require("path");
const config = require("./config.json").bot;
const guildId = process.argv.slice(2)[0] ?? config.guildId;
const { clientId, token } = config;

const commands = [];
const deploycommands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command);
}

const packages = commands.filter((command) => command.package);

packages.forEach((file) => {
  file.package.forEach((subfile) => {
    commands.push(require("./" + path.join("commands", file.path, subfile)));
  });
});

commands.forEach((command) => {
  if (command.idata) {
    deploycommands.push(command.idata.toJSON());
    console.log(command.idata.name + " успешно загружен.");
  }
});

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${deploycommands.length} application (/) commands.`,
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: deploycommands },
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
    process.exit();
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
