const discord = require('discord.js');

module.exports = {
	idata: new discord.SlashCommandBuilder()
		.setName('asay')
		.setDescription('Админ говорит...')
		.setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator)
		.addStringOption(option =>
			option.setName("message")
				.setDescription(`Сообщение, которое будет отображено ботом`)
				.setRequired(true))
		.addAttachmentOption(option =>
			option.setName('attachment')
				.setDescription('Вложение (фото, файл, видева).')
		)
		.addBooleanOption(option =>
			option.setName('tts')
				.setDescription(`Будет ли сообщение преобразовано в речь?`)),
	pdata: {
		name: "asay",
		shortname: 'as'
	},
	/**@param {discord.Interaction} interact @param {discord.Client} bot*/
	async iexec(interact, bot) {
		let args = interact.options.getString('message')
		let tts = interact.options.getBoolean('tts') ?? false
		let attachment
		try {
			attachment = new discord.Attachment(interact.options.getAttachment('attachment'))
		} catch { }
		interact.deferReply()
		if (attachment) {
			if (args) await interact.channel.send({ content: (args), tts: tts, files: [attachment] })
		} else {
			if (args) await interact.channel.send({ content: (args), tts: tts })
		}
		interact.deleteReply()
	},
	async pexec(bot, mess, args) {
		if (!mess.member.permissions.has(discord.PermissionFlagsBits.Administrator)) return mess.channel.send("У  вас нет прав!");
		mess.delete().catch();
		if (!args[0]) return mess.channel.send("* Звук сверчков *");
		if (args[0]) return mess.channel.send(`${args.join(" ")}`);
	}
}

