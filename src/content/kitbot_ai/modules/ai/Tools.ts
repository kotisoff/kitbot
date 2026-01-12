import { tool, Tool } from "@lmstudio/sdk";
import z from "zod";
import { DuckDuck } from "duckduckjs";
import { googleImage, pinterest } from "@bochilteam/scraper-images";
import { wikipedia } from "@bochilteam/scraper-wikipedia";
import { load } from "cheerio";
import { container } from "@sapphire/pieces";
import { joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { Channel } from "discord.js";

let currentConnection: VoiceConnection;

const duck = new DuckDuck();

const tools: Tool[] = [
  tool({
    name: "search_duckduckgo",
    description: "Given one string query. Returns search results of it.",
    parameters: { query: z.string() },
    async implementation({ query }) {
      return await duck.text(query, "ru-ru", undefined, undefined, 15);
    }
  }),
  tool({
    name: "search_image_google",
    description: "Given one string query. Returns search results for images.",
    parameters: { query: z.string() },
    async implementation({ query }) {
      return await googleImage(query);
    }
  }),
  // tool({
  //   name: "read_wikipedia",
  //   description: "Given one wikipedia article title. Returns wikipedia page data.",
  //   parameters: { title: z.string() },
  //   async implementation({ title }) {
  //     return await wikipedia(title, "en");
  //   }
  // }),
  tool({
    name: "read_webpage",
    description: "Given one string url. Returns web page html content.",
    parameters: { url: z.string() },
    async implementation({ url }) {
      const res = fetch(url);

      res.catch((v) => {
        return v;
      });

      const body = await res.then((data) => data.text());
      const $ = load(body);

      return $("body").text().replace(/\s+/g, " ").trim();
    }
  }),
  tool({
    name: "current_time",
    description: "Returns current time and the full date with the year.",
    parameters: {},
    implementation() {
      return new Date().toString();
    }
  }),
  tool({
    name: "connect_to_voice_chat",
    description: "Given string guild id and (channel id or user id). Tries to connect to voice channel.",
    parameters: {
      voicechannel_id: z.optional(z.string()),
      user_id: z.optional(z.string()),
      guild_id: z.string()
    },
    async implementation({ voicechannel_id, user_id, guild_id }) {
      let channel_id = voicechannel_id;
      let channel: Channel | undefined | null;

      if (!channel_id && user_id) {
        const guild = container.client.guilds.resolve(guild_id);

        if (!guild) {
          return "Guild not found. Make sure you used int-like id. Example: 1234567891011121314";
        }

        const member = guild.members.resolve(user_id);

        if (member) {
          const vc_id = member.voice.channelId;
          if (!vc_id) {
            return "User is not connected to voice channel.";
          }

          channel_id = vc_id;
        } else {
          return "User not found. Make sure you used int-like id. Example: 1234567891011121314";
        }
      }

      if (channel_id) {
        channel = container.client.channels.resolve(channel_id);
      } else {
        return "Failed to retrieve channel id.";
      }

      if (channel && channel.isVoiceBased()) {
        if (currentConnection) {
          currentConnection.disconnect();
          currentConnection.destroy();
        }

        currentConnection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guildId,
          selfDeaf: false,
          selfMute: false,
          adapterCreator: channel.guild.voiceAdapterCreator
        });

        return [
          "Connected!",
          `Members: ${(await channel.fetch()).members
            .values()
            .toArray()
            .map((v) => v.user.username)
            .join(", ")}`
        ].join("\n");
      }
      return "Channel not found. Make sure you used int-like id. Example: 1234567891011121314)";
    }
  }),
  tool({
    name: "fetch_voice_info",
    description: "Returns info about voice channel if bot is in one: name, member list, bitrate and id",
    parameters: {},
    async implementation() {
      if (currentConnection) {
        const channelId = currentConnection.joinConfig.channelId as string;
        const channel: Channel = (await container.client.channels.resolve(channelId)?.fetch()) as Channel;

        if (channel.isVoiceBased()) {
          return {
            name: channel.name,
            members: channel.members
              .values()
              .toArray()
              .map((u) => ({ id: u.user.id, name: u.user.globalName, username: u.user.username })),
            bitrate: channel.bitrate,
            id: channel.id
          };
        }
      }
    }
  }),
  tool({
    name: "create_voice_invite_link",
    description: "Creates new invite link to voice channel.",
    parameters: { voice_channel_id: z.string() },
    async implementation({ voice_channel_id }) {
      const channel = container.client.channels.resolve(voice_channel_id);
      if (!channel) {
        return "Channel not found. Make sure you used int-like id. Example: 1234567891011121314)";
      }

      if (channel.isVoiceBased()) {
        const invite = channel.createInvite({ maxUses: 1 });
        return invite;
      }

      return "Channel is not voice based!";
    }
  }),
  tool({
    name: "fetch_user_info",
    description: "Given one user id string. Returns info about user: id, name, username, avatar url",
    parameters: { user_id: z.string() },
    async implementation({ user_id }) {
      const user = await container.client.users.resolve(user_id)?.fetch();
      if (!user) {
        return "User not found. Make sure you used int-like id. Example: 1234567891011121314)";
      }

      return {
        id: user.id,
        name: user.globalName,
        username: user.username,
        avatar: user.avatarURL(),
        is_bot: user.bot
      };
    }
  }),
  tool({
    name: "fetch_guild_info",
    description: "Given one guild id string. Returns info about guild: id, icon url, name, channel list",
    parameters: { guild_id: z.string() },
    async implementation({ guild_id }) {
      const guild = await container.client.guilds.resolve(guild_id)?.fetch();
      if (!guild) {
        return "User not found. Make sure you used int-like id. Example: 1234567891011121314)";
      }

      return {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        verified: guild.verified,
        channels: (await guild.channels.fetch())
          .values()
          .toArray()
          .map((c) => ({ name: c?.name, id: c?.id, is_voice: c?.isVoiceBased() }))
      };
    }
  }),
  tool({
    name: "send_direct_message",
    description: "Send given message to user id you want.",
    parameters: {
      message: z.string(),
      user_id: z.string()
    },
    async implementation({ message, user_id }) {
      const user = await container.client.users.resolve(user_id)?.fetch();
      if (!user) {
        return "User not found. Make sure you used int-like id. Example: 1234567891011121314)";
      }

      return user
        .send(message)
        .then(() => {
          return `Message sent to ${user.username}`;
        })
        .catch((reason) => {
          return `Could not send message: ${reason?.message}`;
        });
    }
  }),
  tool({
    name: "list_guild_users",
    description:
      "Given one string guild id. Returns list of it's users. Helps you find out who is the person user requests.",
    parameters: {
      guild_id: z.string()
    },
    async implementation({ guild_id }) {
      const guild = container.client.guilds.resolve(guild_id);
      if (!guild) {
        return "Guild not found. Make sure you used int-like id. Example: 1234567891011121314)";
      }

      const members = await guild.members.fetch();

      return JSON.stringify(
        members
          .values()
          .toArray()
          .map((u) => ({ name: u.user.displayName, id: u.user.id, username: u.user.username }))
      );
    }
  }),
  tool({
    name: "list_my_guilds",
    description: "Returns list of guilds (or servers) you are in.",
    parameters: {},
    async implementation() {
      return JSON.stringify(
        (await container.client.guilds.fetch())
          .values()
          .toArray()
          .map((v) => ({ name: v.name, id: v.id }))
      );
    }
  })
];

export default tools;
