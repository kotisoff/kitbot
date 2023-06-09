const { SlashCommandBuilder } = require('discord.js')
const net = require('net');
const colors = require('colors')

function hex2tex(hexx) {
    let hex = hexx.toString()
    let str = ''
    for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    return str
}

function toHex(arr) {
    let result = "";
    for (i = 0; i < arr.length; i++) {
        let num = arr[i].toString(16)
        if (num.length < 2) {
            num = "0" + num;
            arr[i] = num;
        };
        result += num;
    };
    return result;
};

function hex2a(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += parseInt(hex.substr(i, 2), 16) + ",";
    };
    str = str.substr(0, str.length - 1);

    return Buffer.from(JSON.parse('{"type":"Buffer","data":[' + str + ']}'));
};

async function updateHost(ip, port) {
    return new Promise((resolve, reject) => {
        let ping = Date.now()
        let msg, output
        const client = new net.Socket();
        client.connect(port, ip, function () {
            client.on('error', err => { output = (`Произошла ошибка: ${err}`) })
            client.write(hex2a("1000F705096D75726B612D73797363DD010100")) //отправляем запрос на пинг
            client.on('data', message => {
                let temp
                if (!msg) {
                    temp = toHex(JSON.parse(JSON.stringify(message)).data)
                    msg = temp.substring(10, temp.length)
                } else {
                    temp = toHex(JSON.parse(JSON.stringify(message)).data)
                    msg += temp.substring(0, temp.length)
                }
                let textmsg = hex2tex(msg)
                if (textmsg.substring(textmsg.length - 1, textmsg.length) == "}") { //если каким-то образом получится так, что ответ разделился на несколько сообщений, то мы их совмещаем
                    client.destroy()
                    let result = JSON.parse(textmsg).players
                    output = (`Онлайн: ${result.online}/${result.max}`)
                    ping = Date.now() - ping
                    let tempsample = []
                    let playerlist = ""
                    for (let i in result.sample) {
                        playerlist += result.sample[i].name + ", "
                        delete result.sample[i].id
                        tempsample[i] = result.sample[i].name
                    }
                    if (playerlist != "") {
                        playerlist = playerlist.substring(0, playerlist.length - 2) + ""
                        output += ("\nСписок игроков:"+"`"+playerlist+"`")
                    }
                    output += (`\nПинг: ${ping}`)
                    if(output!=undefined){resolve(output)}else{resolve('Произошла неизвестная ошибка.')}
                }
            })
            client.on('close', function () {
                client.destroy()
            })
            client.on('timeout', function () { resolve('Превышено время ожидания.') })
        });
        client.on('error', err => { resolve(`Произошла ошибка при подключении к серверу: ${err.code}`) })
    })
}

module.exports = {
    type: 'i',
    idata: new SlashCommandBuilder()
        .setName('mcstatus')
        .setDescription('Запрашивает информацию об игроках на сервере Майнкрафт.')
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('Айпи адрес сервера. Порт вписывается через ":".')
                .setRequired(true)),
    async iexec(interaction, bot) {
        const ip = interaction.options.getString('ip').split(':')[0]
        let port = interaction.options.getString('ip').split(':')[1] ?? 25565
        if(port<0 || port>65535) return interaction.reply(`Некорректный порт! Port should be >= 0 and < 65536. Received ${port}.`)
        updateHost(ip, port).then(out=>{interaction.reply(`${out}`)})
    }
}