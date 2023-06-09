const discord = require('discord.js');

module.exports = {
	type: 'c',
	idata: new discord.SlashCommandBuilder()
		.setName('fy')
		.setDescription('Послать нахуй')
		.addUserOption(option =>
			option.setName("user")
				.setDescription(`Кого послать?`)),
	pdata: {
		name: "fuckyou",
		shortname: 'fy',
		runame: 'идинахуй'
	},
	async iexec(interact, bot) {
		let args = interact.options.getUser('user')
		if (!args) await interact.channel.send('Пiшов нахуй!');
		if (args) await interact.channel.send(`Пiшов нахуй, ${args}!`)
		interact.reply('_ _')
		interact.deleteReply()
	},
	async pexec(bot, mess, args){
		mess.delete().catch();
		if(!args[0]) return mess.channel.send('Пiшов нахуй!');
		if(args[0]) return mess.channel.send(`Пiшов нахуй, ${args.join(" ")}!`);
	}
}