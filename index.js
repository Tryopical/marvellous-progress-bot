import { Client, GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import fs from "fs";

const TOTAL = 3948;
const DATA_FILE = "./progress.json";

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("finished")
    .setDescription("Mark Marvellous Smackdown content as finished")
    .addStringOption(opt =>
      opt.setName("title")
        .setDescription("What you finished")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("progress")
    .setDescription("View your Marvellous Smackdown progress")
].map(cmd => cmd.toJSON());

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.application.commands.set(commands);
});

client.on("interactionCreate", interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const userId = interaction.user.id;

  if (!data[userId]) data[userId] = { count: 0 };

  if (interaction.commandName === "finished") {
    data[userId].count++;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    const percent = ((data[userId].count / TOTAL) * 100).toFixed(2);

    interaction.reply(
      `✅ Finished **${interaction.options.getString("title")}**!\n` +
      `📊 You have watched **${data[userId].count}/${TOTAL} (${percent}%)**`
    );
  }

  if (interaction.commandName === "progress") {
    const percent = ((data[userId].count / TOTAL) * 100).toFixed(2);

    interaction.reply(
      `📊 Your progress: **${data[userId].count}/${TOTAL} (${percent}%)**`
    );
  }
});

client.login(process.env.BOT_TOKEN);
