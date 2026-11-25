import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { createCommands } from './commands.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error('Configure DISCORD_TOKEN e CLIENT_ID no arquivo .env');
}

const rest = new REST({ version: '10' }).setToken(token);
await rest.put(Routes.applicationCommands(clientId), {
  body: createCommands(),
});
console.log('Comandos registrados globalmente.');
