import { Client, GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import fs from "fs";

const DATA_FILE = "./progress.json";

// If the data file doesn't exist, create it with a default structure
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ total: 3948, users: {} }));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Build slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("finished")
    .setDescription("Mark content as finished")
    .addStringOption(opt =>
      opt.setName("title")
        .setDescription("Title you finished")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("progress")
    .setDescription("View your current progress"),

  new SlashCommandBuilder()
    .setName("settotal")
    .setDescription("Set the total number of shows/movies")
    .addIntegerOption(opt =>
      opt.setName("number")
        .setDescription("New total number")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// Register slash commands once the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.application.commands.set(commands);
});

// Handle interaction events
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Load saved data
  const raw = JSON.parse(fs.readFileSync(DATA_FILE));
  const users = raw.users ?? {};
  const userId = interaction.user.id;
  if (!users[userId]) users[userId] = { count: 0 };

  // **IMPORTANT:** Defer reply so Discord DOES NOT timeout
  await interaction.deferReply({ ephemeral: false });

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
    // Fetch the full member object so we can check roles
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const hasRole = member.roles.cache.some(role => role.name === "Bot Mechanic");

    if (!hasRole) {
      return interaction.followUp(
        `❌ You don’t have permission to change the total.`
      );
    }

    const newTotal = interaction.options.getInteger("number");
    raw.total = newTotal;
    fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2));

    return interaction.followUp(
      `✅ Total number of shows/movies set to **${newTotal}**.`
    );
  }
});

// Log in using the bot token from environment
client.login(process.env.BOT_TOKEN);
