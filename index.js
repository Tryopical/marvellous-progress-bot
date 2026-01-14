import { Client, GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import express from "express";

/* -------------------- */
/* Render port fix      */
/* -------------------- */
const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(process.env.PORT || 3000, () => {
  console.log("Web server listening (Render port fix)");
});

/* -------------------- */
/* Bot setup            */
/* -------------------- */

const DATA_FILE = "./progress.json";

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ total: 3948, users: {} }, null, 2)
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* -------------------- */
/* Slash commands       */
/* -------------------- */

const commands = [
  new SlashCommandBuilder()
    .setName("finished")
    .setDescription("Mark content as finished")
    .addStringOption(opt =>
      opt
        .setName("title")
        .setDescription("Title you finished")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("progress")
    .setDescription("View your progress"),

  new SlashCommandBuilder()
    .setName("settotal")
    .setDescription("Set total number of shows/movies")
    .addIntegerOption(opt =>
      opt
        .setName("number")
        .setDescription("New total")
        .setRequired(true)
    )
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.application.commands.set(commands);
});

/* -------------------- */
/* Interaction handler  */
/* -------------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply({ ephemeral: false });

  const raw = JSON.parse(fs.readFileSync(DATA_FILE));
  const users = raw
