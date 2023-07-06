const discord = require('discord.js');

module.exports = {
	idata: new discord.SlashCommandBuilder()
		.setName('murka')
		.setDescription('Murka said...')
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
	async iexec(interaction,bot) {
		if(interaction.user.id!="429307451825717250") return await interaction.reply({content:"Ты не мурка >:|",ephemeral: true })
        const whook = new discord.WebhookClient({ url: "https://discord.com/api/webhooks/1123710153552838758/JXQZmnpMKUTK8Vs_mwpjz9LHB-_1mCrhxw2JVAt26AhS0KdVAkj37ja-Phlg0eaqaXSG" })
        let msg = interaction.options.getString('message')
		let tts = interaction.options.getBoolean('tts') ?? false
		let attachment
		try {
			attachment = new discord.Attachment(interaction.options.getAttachment('attachment'));
		} catch { }
        await interaction.reply({content:"Сообщение отправляется...",ephemeral: true });
		if (attachment) {
			if (msg) await whook.send({ content: (msg), tts: tts, files: [attachment] });
		} else {
			if (msg) await whook.send({ content: (msg), tts: tts });
		}
        interaction.deleteReply();
	}
}