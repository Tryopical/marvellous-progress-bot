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
  fs.writeFileSync(DATA_FILE, JSON.stringify({ total: 3948, users: {} }, null, 2));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

/* -------------------- */
/* Slash commands       */
/* -------------------- */
const commands = [
  new SlashCommandBuilder()
    .setName("finished")
    .setDescription("Mark content as finished")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Title you finished").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("progress")
    .setDescription("View your progress"),

  new SlashCommandBuilder()
    .setName("settotal")
    .setDescription("Set total number of shows/movies")
    .addIntegerOption((opt) =>
      opt.setName("number").setDescription("New total").setRequired(true)
    ),
].map((c) => c.toJSON());

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.application.commands.set(commands);
});

/* -------------------- */
/* Interaction handler  */
/* -------------------- */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Prevent "The application did not respond"
  await interaction.deferReply({ ephemeral: false });

  const raw = JSON.parse(fs.readFileSync(DATA_FILE));
  const users = raw.users ?? {};
  const userId = interaction.user.id;

  if (!users[userId]) users[userId] = { count: 0 };

  if (interaction.commandName === "finished") {
    users[userId].count++;
    raw.users = users;
    fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2));

    const percent = ((users[userId].count / raw.total) * 100).toFixed(2);

    return interaction.followUp(
      `✅ Finished **${interaction.options.getString("title")}**!\n` +
        `📊 You have watched **${users[userId].count}/${raw.total} (${percent}%)**`
    );
  }

  if (interaction.commandName === "progress") {
    const percent = ((users[userId].count / raw.total) * 100).toFixed(2);

    return interaction.followUp(
      `📊 Your progress: **${users[userId].count}/${raw.total} (${percent}%)**`
    );
  }

  if (interaction.commandName === "settotal") {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasRole = member.roles.cache.some((r) => r.name === "Bot Mechanic");

    if (!hasRole) {
      return interaction.followUp("❌ You don’t have permission to change the total.");
    }

    const newTotal = interaction.options.getInteger("number");
    raw.total = newTotal;
    fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2));

    return interaction.followUp(`✅ Total number of shows/movies set to **${newTotal}**.`);
  }

  // Fallback (should never hit, but prevents hanging)
  return interaction.followUp("⚠️ Unknown command.");
});

/* -------------------- */
/* Login                */
/* -------------------- */
client.login(process.env.BOT_TOKEN);
