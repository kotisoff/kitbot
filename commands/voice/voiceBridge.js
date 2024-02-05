const discord = require("discord.js");
const dvoice = require("@discordjs/voice");
const Stream = require("stream");
const Command = require("../../utils/Command");
const { randomBytes } = require("crypto");

// Эта хуйня тебе не очень сука нужна

const voiceBridge = new Command("voicebridge", "voiceBridge");
voiceBridge.slashCommandInfo
  .setDescription("Connects few voice channel.")
  .addStringOption((o) =>
    o
      .setName("option")
      .setDescription("Option.")
      .addChoices(
        {
          name: "Create room",
          value: "create"
        },
        { name: "Join room", value: "join" }
      )
      .setRequired(true)
  )
  .addChannelOption((o) =>
    o
      .setName("targetchannel")
      .setDescription("Voice channel, that will be connected.")
      .addChannelTypes(
        discord.ChannelType.GuildVoice,
        discord.ChannelType.GuildStageVoice
      )
      .setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("roomcode").setDescription("Code for joining to room.")
  );

// До сюдова (это объяснение дискорду комманды вообще) жоска

// Вот эта хуебобина является классом стрима, чтобы вся эта залупа работала.
// я сам сука не понимаю с хуя ли оно работает, но ладно

class roomStream extends Stream.Readable {
  _read = () => {};
  constructor(options) {
    super({ ...options, objectMode: true });
  }
}

// Объявление массива с комнатушками

const rooms = [
  {
    code: "0",
    channels: [""],
    admins: [""],
    stream: roomStream.prototype,
    busyData: ""
  }
];
// обнуляем комнату, типа чистим, но типы для вс цоде остаются
rooms.length = 0;

// Хандле чанк собсна

/** @param { rooms[0] } room @param { discord.VoiceChannel } channel */
const handleChunk = async (chunk, room, channel) => {
  if (room.busyData) {
    voiceBridge.logger.info("Append busy data");
    room.busyData = Buffer.concat([room.busyData, chunk]);
    return;
  }
  room.busyData = chunk;
  setTimeout(() => {
    room.stream.push(
      JSON.stringify({ channelid: channel.id, data: room.busyData })
    );
    room.busyData = "";
  }, 1);
};

// Хандле коннектион собсна

/**
 * @param { room[0] } room
 * @param { dvoice.VoiceConnection } connection
 * @param { discord.VoiceChannel } channel
 */
const handleConnection = async (room, connection, channel) => {
  // Сама функтион
  const receiver = connection.receiver;
  const speaking = receiver.speaking;

  // если рандом ебалай начнёт говорить
  speaking.on("start", async (uid) => {
    // мы проверяем, есть ли на него подписочка (листенер)
    if (receiver.subscriptions.has(uid)) return;
    // если есть, идём нахуй, иначе создаём константу стрима с подпиской на ебалая
    const stream = receiver.subscribe(uid);
    // при получении данных от ебалаевского голоса
    stream.on("data", async (chunk) => {
      // мы закодированный чанк перекодируем (просто суём в жсон с идентификатором канала, откуда голосок был пойман) и отправляем дальше
      handleChunk(chunk, room, channel);
    });
  });

  // если мы получаем любые данные от стрима комнатушки в которой находимся
  room.stream.on("data", async (chunk) => {
    // то парсим данные
    const data = JSON.parse(chunk);
    if (data.channelid == channel.id) return; // если идентификатор канала данных совпадает с идентификатором текущего канала, то идём нахуй
    connection.playOpusPacket(Buffer.from(data.data)); // иначе отправляем боту на воспроизведение (здесь начинается жоска жувание звука наверное)
  });
  // май сысли: может быть можно на каждого пользователя, или как минимум канал создавать отдельный стрим с данными и это очень бы оптимизровало звук, но не сам процесс, он чуть чуть больше нагрузица
};

// Вызов команды
voiceBridge.setSlashAction(async (interact, client) => {
  // получаем данные от параметров команды
  const option = interact.options.getString("option");
  const channel = interact.options.getChannel("targetchannel");
  const code = interact.options.getString("roomcode"); // рум код не всегда предоставляется. обычно только при присоединении.

  // обновляем данные канала для бота
  const channelData = await channel.fetch();
  const membersCount = channelData.members.size;
  const voiceNotEmpty = membersCount > 0;
  await interact.reply("In voice channel: " + membersCount);
  if (!voiceNotEmpty) return interact.followUp("Nobody is in voice channel!"); // проверка на наличие пользователей в канале

  // функция для присоединения к голосовому каналу
  const connect = () => {
    // логируем присоединение моей мозгодробительной ахуительной и тому подобной утилитой логирования
    voiceBridge.logger.info(
      "Connecting to",
      `"${channel.name}" (${channel.id}).`
    );
    // присоединяемся к каналу, используя настроечки
    return dvoice.joinVoiceChannel({
      selfDeaf: false, // мут звука
      selfMute: false, // мут микрофона
      guildId: channel.guildId, // айди сервака
      channelId: channel.id, // айди канала
      adapterCreator: channel.guild.voiceAdapterCreator // адаптер? хз ваще, нужно для создания соединения.
    });
  };

  // если мы создаём комнатушку
  if (option == "create") {
    // делаем функцию для генерации кода с 4 рандомными байтами и переводим в хекс (8 символов)
    const generateCode = () => randomBytes(4).toString("hex");
    // проверяем на повтор кода, если да, то ~~пизда~~ генерируем новый
    let tempCode = generateCode();
    while (rooms.filter((r) => r.code == tempCode).length) {
      tempCode = generateCode();
    }

    // создаём комнатушку
    const room = {
      code: tempCode,
      channels: [channel.id],
      admins: [interact.user.id],
      stream: new roomStream(),
      busyData: ""
    };

    // пишем везде и всюду о комнате
    await interact.followUp("Hosting new room. Code: " + room.code);
    voiceBridge.logger.info(
      `Created new room (${room.code}) in ${channel.name} (${channel.id})`
    );

    // пушим комнату в массив комнат
    rooms.push(room);

    // создаём подключение нашей ахуительной функцией
    const connection = connect();

    // отправляем комнату, подключение и канал на растерзание функции
    handleConnection(room, connection, channel);
    // если мы присоединяемся к комнате
  } else if (option == "join") {
    // получаем комнату по коду
    const room = rooms.filter((room) => room.code == code)[0];
    // если таковой не найдено, то идём нахуй)
    if (!room) return await interact.followUp("No room with your code found.");
    // иначе идём дальше и пишем в канал о подключении
    await interact.followUp(`Connected to room (${code}).`);
    voiceBridge.logger.info(
      `${channel.name} (${channel.id}) connected to room (${room.code}). At the moment in room: ${room.channels.join()} (${room.channels.length} channels).`
    );

    // пушим наш канал в массив каналов комнаты
    room.channels.push(channel.id);

    // присоединяемся
    const connection = connect();

    // отправляем данные на растерзание
    handleConnection(room, connection, channel);
  }
});

// экспортируем команду нахуй
module.exports = voiceBridge;
