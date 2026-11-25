# Bot de embeds do Discord

Bot em Node.js que cria um embed personalizado pela interface do Discord com o comando `/embed`.

## Configuracao

1. Crie uma aplicacao em <https://discord.com/developers/applications>.
2. Em **Bot**, crie o token e habilite o bot.
3. Em **OAuth2 > URL Generator**, selecione `bot` e `applications.commands`, depois conceda permissao para **Manage Messages** e **Send Messages**.
4. Copie `.env.example` para `.env` e preencha:

```env
DISCORD_TOKEN=seu_token
CLIENT_ID=id_da_aplicacao
```

O comando `/embed` é registrado globalmente. Convide o bot para cada servidor onde ele será usado, usando os escopos `bot` e `applications.commands`. Comandos globais podem levar algum tempo para aparecer após o registro.

## Instale e execute

```powershell
npm.cmd install
npm.cmd start
```

O bot registra `/embed` automaticamente ao iniciar.

## Uso

Use `/embed` ou `/embed canal:#nome-do-canal`. Selecione um elemento no menu para editar seu titulo, descricao, cor, imagem, miniatura, autor, rodape ou o texto e emoji do botao. Use **Remover botão**/**Ativar botão** para controlar se ele aparece no embed publicado. Sem uma imagem externa, o bot gera um banner PNG exclusivo para o conteudo e a cor de cada embed, mantendo o estilo escuro com grade e detalhes amarelos. Use **Visualizar** para ver uma previa privada, **Publicar** para enviar o embed ou **Redefinir** para restaurar o modelo inicial.
