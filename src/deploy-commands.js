import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error('Configure DISCORD_TOKEN e CLIENT_ID no arquivo .env');
}

const command = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Abre o personalizador de embeds')
  .setDMPermission(false)
  .setDefaultMemberPermissions('8192')
  .addChannelOption((option) =>
    option
      .setName('canal')
      .setDescription('Canal em que o embed sera publicado')
      .setRequired(false),
  );

const rest = new REST({ version: '10' }).setToken(token);
await rest.put(Routes.applicationCommands(clientId), {
  body: [command.toJSON()],
});
console.log('Comando /embed registrado globalmente.');
