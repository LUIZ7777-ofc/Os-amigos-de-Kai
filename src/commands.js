import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

export function createCommands() {
  return [
    new SlashCommandBuilder()
      .setName('embed')
      .setDescription('Abre o personalizador de embeds')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addChannelOption((option) =>
        option
          .setName('canal')
          .setDescription('Canal em que o embed sera publicado')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(false),
      ),
    new SlashCommandBuilder()
      .setName('ajuda')
      .setDescription('Mostra os comandos disponiveis'),
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Mostra a latencia do bot e da API do Discord'),
    new SlashCommandBuilder()
      .setName('servidor')
      .setDescription('Mostra informacoes deste servidor')
      .setDMPermission(false),
    new SlashCommandBuilder()
      .setName('usuario')
      .setDescription('Mostra informacoes de um usuario')
      .setDMPermission(false)
      .addUserOption((option) =>
        option
          .setName('membro')
          .setDescription('Usuario para consultar')
          .setRequired(false),
      ),
  ].map((command) => command.toJSON());
}
