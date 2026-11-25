import 'dotenv/config';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  ModalBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { createBanner, getBannerFilename } from './banner.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error('Configure DISCORD_TOKEN e CLIENT_ID no arquivo .env');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const drafts = new Map();
const draftTTL = 30 * 60 * 1000;

function createDraft() {
  return {
    title: 'Exames das Divisões',
    description:
      'Quer entrar numa divisao? Siga as que quiser e receba o aviso na hora em que abrir o exame.',
    color: '#7C3AED',
    authorName: 'Zape cansado',
    authorIcon: '',
    image: '',
    thumbnail: '',
    footerText: 'Sem acesso.',
    buttonEnabled: true,
    buttonLabel: 'Abrir minha ficha',
    buttonEmoji: '🧭',
  };
}

function hexToInt(value) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return 0x5865f2;
  }
  return Number.parseInt(value.slice(1), 16);
}

function buildEmbed(draft) {
  const embed = new EmbedBuilder()
    .setColor(hexToInt(draft.color))
    .setAuthor({
      name: draft.authorName || 'Zape cansado',
      iconURL: draft.authorIcon || undefined,
    })
    .setTitle(`🧭 ${draft.title || 'Exames das Divisoes'}`)
    .setDescription(
      `${draft.description || 'Quer entrar numa divisao?'}\n\n` +
      `👻  🦇  🟡  🧬  🌡️  ☀️  📊  ⚙️`,
    )
    .setTimestamp(new Date());

  if (draft.thumbnail) embed.setThumbnail(draft.thumbnail);
  if (draft.image) {
    embed.setImage(draft.image);
  } else {
    embed.setImage(`attachment://${getBannerFilename(draft)}`);
  }
  embed.setFooter({ text: draft.footerText || 'Sem acesso.' });

  return embed;
}

function buildAttachment(draft) {
  if (draft.image) return [];
  return [
    new AttachmentBuilder(createBanner(draft), {
      name: getBannerFilename(draft),
    }),
  ];
}

function buildPublicButton(draft) {
  if (!draft.buttonEnabled) return [];

  const button = new ButtonBuilder()
    .setCustomId('embed_open_ficha')
    .setLabel(draft.buttonLabel)
    .setStyle(ButtonStyle.Primary);

  if (draft.buttonEmoji) button.setEmoji(draft.buttonEmoji);

  return [
    new ActionRowBuilder().addComponents(
      button,
    ),
  ];
}

function buildMenu(draft, targetChannelId) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('embed_edit_field')
    .setPlaceholder('Escolha o elemento para personalizar')
    .addOptions([
      { label: 'Titulo', value: 'title', emoji: '📝' },
      { label: 'Descricao', value: 'description', emoji: '💬' },
      { label: 'Cor', value: 'color', emoji: '🎨' },
      { label: 'Imagem', value: 'image', emoji: '🖼️' },
      { label: 'Miniatura', value: 'thumbnail', emoji: '🔲' },
      { label: 'Autor', value: 'author', emoji: '👤' },
      { label: 'Rodape', value: 'footer', emoji: 'Ⓜ️' },
      { label: 'Texto e emoji do botao', value: 'button', emoji: '🔘' },
    ]);

  const selectRow = new ActionRowBuilder().addComponents(select);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_preview')
      .setLabel('Visualizar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👁️'),
    new ButtonBuilder()
      .setCustomId('embed_publish')
      .setLabel(targetChannelId ? 'Publicar no canal' : 'Publicar aqui')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🚀'),
    new ButtonBuilder()
      .setCustomId('embed_reset')
      .setLabel('Redefinir')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('embed_toggle_button')
      .setLabel(draft.buttonEnabled ? 'Remover botão' : 'Ativar botão')
      .setStyle(draft.buttonEnabled ? ButtonStyle.Danger : ButtonStyle.Secondary)
      .setEmoji(draft.buttonEnabled ? '➖' : '➕'),
  );

  return [selectRow, buttons];
}

function getDraft(interaction) {
  const existing = drafts.get(interaction.user.id);
  if (!existing || Date.now() - existing.updatedAt > draftTTL) {
    const draft = { data: createDraft(), targetChannelId: null, updatedAt: Date.now() };
    drafts.set(interaction.user.id, draft);
  }
  const entry = drafts.get(interaction.user.id);
  entry.updatedAt = Date.now();
  return entry;
}

function setDraft(interaction, updater) {
  const entry = getDraft(interaction);
  updater(entry.data);
  entry.updatedAt = Date.now();
  return entry;
}

async function registerCommands() {
  const command = new SlashCommandBuilder()
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
    );

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), {
    body: [command.toJSON()],
  });
}

client.once('clientReady', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'embed') {
      const entry = getDraft(interaction);
      entry.targetChannelId =
        interaction.options.getChannel('canal')?.id ?? interaction.channelId;

      await interaction.reply({
        content: '🎨 Personalizador de embed',
        embeds: [buildEmbed(entry.data)],
        components: buildMenu(entry.data, entry.targetChannelId),
        files: buildAttachment(entry.data),
        ephemeral: true,
      });
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'embed_edit_field') {
      const field = interaction.values[0];
      const entry = getDraft(interaction);

      const modal = new ModalBuilder()
        .setCustomId(`embed_modal_${field}`)
        .setTitle(`Editar ${field}`);

      if (field === 'title') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Titulo')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setMaxLength(256)
              .setValue(entry.data.title || ''),
          ),
        );
      } else if (field === 'description') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Descricao')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(4000)
              .setValue(entry.data.description || ''),
          ),
        );
      } else if (field === 'color') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Cor em hexadecimal')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('#7C3AED')
              .setRequired(true)
              .setMaxLength(7)
              .setValue(entry.data.color || '#5865F2'),
          ),
        );
      } else if (field === 'image' || field === 'thumbnail') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel(field === 'image' ? 'URL da imagem' : 'URL da miniatura')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('https://...')
              .setRequired(false)
              .setMaxLength(500)
              .setValue(entry.data[field] || ''),
          ),
        );
      } else if (field === 'author') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('name')
              .setLabel('Nome do autor')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setMaxLength(256)
              .setValue(entry.data.authorName || ''),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('icon')
              .setLabel('URL do icone')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('https://...')
              .setRequired(false)
              .setMaxLength(500)
              .setValue(entry.data.authorIcon || ''),
          ),
        );
      } else if (field === 'footer') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('value')
              .setLabel('Texto do rodape')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setMaxLength(2048)
              .setValue(entry.data.footerText || ''),
          ),
        );
      } else if (field === 'button') {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('label')
              .setLabel('Texto do botao')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(80)
              .setValue(entry.data.buttonLabel || 'Abrir minha ficha'),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('emoji')
              .setLabel('Emoji (opcional)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ex.: 🎮')
              .setRequired(false)
              .setMaxLength(32)
              .setValue(entry.data.buttonEmoji || ''),
          ),
        );
      }

      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('embed_modal_')) {
      const field = interaction.customId.replace('embed_modal_', '');
      const entry = setDraft(interaction, (draft) => {
        if (field === 'author') {
          draft.authorName = interaction.fields.getTextInputValue('name');
          draft.authorIcon = interaction.fields.getTextInputValue('icon');
        } else if (field === 'button') {
          draft.buttonLabel = interaction.fields.getTextInputValue('label').trim();
          draft.buttonEmoji = interaction.fields.getTextInputValue('emoji').trim();
        } else if (field === 'color') {
          const value = interaction.fields.getTextInputValue('value').trim();
          draft.color = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : draft.color;
        } else {
          draft[field] = interaction.fields.getTextInputValue('value');
        }
      });

      await interaction.update({
        content: '✅ Embed atualizado',
        embeds: [buildEmbed(entry.data)],
        components: buildMenu(entry.data, entry.targetChannelId),
        files: buildAttachment(entry.data),
      });
      return;
    }

    if (interaction.isButton()) {
      const entry = getDraft(interaction);

      if (interaction.customId === 'embed_preview') {
        await interaction.reply({
          embeds: [buildEmbed(entry.data)],
          files: buildAttachment(entry.data),
          ephemeral: true,
        });
      } else if (interaction.customId === 'embed_reset') {
        entry.data = createDraft();
        await interaction.update({
          content: '🔄 Personalizacao redefinida',
          embeds: [buildEmbed(entry.data)],
          components: buildMenu(entry.data, entry.targetChannelId),
          files: buildAttachment(entry.data),
        });
      } else if (interaction.customId === 'embed_toggle_button') {
        entry.data.buttonEnabled = !entry.data.buttonEnabled;
        await interaction.update({
          content: entry.data.buttonEnabled
            ? '✅ Botão ativado'
            : '✅ Botão removido do embed',
          embeds: [buildEmbed(entry.data)],
          components: buildMenu(entry.data, entry.targetChannelId),
          files: buildAttachment(entry.data),
        });
      } else if (interaction.customId === 'embed_publish') {
        const channel =
          entry.targetChannelId && interaction.guild
            ? await interaction.guild.channels.fetch(entry.targetChannelId).catch(() => null)
            : interaction.channel;

        if (
          !channel ||
          !channel.isTextBased() ||
          !channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)
        ) {
          await interaction.reply({
            content: 'Nao foi possivel encontrar o canal ou enviar mensagens nele.',
            ephemeral: true,
          });
          return;
        }

        await channel.send({
          embeds: [buildEmbed(entry.data)],
          components: buildPublicButton(entry.data),
          files: buildAttachment(entry.data),
        });
        await interaction.reply({
          content: `Embed publicado em ${channel}.`,
          ephemeral: true,
        });
      } else if (interaction.customId === 'embed_open_ficha') {
        await interaction.reply({
          content: '🧭 Sua ficha foi aberta. Escolha uma divisao para receber os avisos.',
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error(error);
    const payload = {
      content: 'Ocorreu um erro ao processar esta interacao.',
      ephemeral: true,
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

await registerCommands();
await client.login(token);
