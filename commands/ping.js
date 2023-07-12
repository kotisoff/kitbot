const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	idata: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	/**@param {discord.Interaction} interact @param {discord.Client} bot*/
	async iexec(interaction,bot) {
		let APIping = Math.round(bot.ws.ping)
		interaction.reply(`Понг сука! Задержка ебучего API: ${APIping}мс`);
		if(APIping >= 400) {
			interaction.followup('Происходит какой-то пиздец! Хули так много?');
		};
	}
}