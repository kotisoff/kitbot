import * as dotenv from "dotenv";
import { GatewayIntentBits } from "discord.js";
import CustomBotClient from "./core/CustomBotClient";
import { ApplicationCommandRegistries } from "@sapphire/framework";

dotenv.config({ quiet: true });

if (!process.env.DISCORD_TOKEN) {
  throw Error("No DISCORD_TOKEN specified in .env file!");
}

const client = new CustomBotClient({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessagePolls,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessagePolls,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.Guilds
  ],
  defaultPrefix: "'"
});

client.login(process.env.DISCORD_TOKEN);

ApplicationCommandRegistries.setDefaultGuildIds(["1053253637121523723"]);
