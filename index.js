// Chargement des variables d'environnement à partir du fichier .env
require("dotenv").config();

// Importation des modules nécessaires
const { ActivityType, Client } = require("discord.js");
const { OpenAI } = require("openai");

// Instructions pour l'assistant
const PROMPT = "Tu es un assistant utile. Tes réponses sont toujours courtes avec des émojis.";
// Modèle à utiliser
const MODEL = "gpt-3.5-turbo";
// Liste des ID des salons où le bot doit répondre
const CHANNELS = ["0000000000000000000", "0000000000000000000"];
// Nom et du type d'activité du bot
const ACTIVITY_NAME = "répondre aux questions";
const ACTIVITY_TYPE = ActivityType.Playing;
// Longueur de l'historique des messages
const HISTORY_LENGTH = 9;

// Création de l'instance OpenAI avec la clé d'API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Création du client Discord
const client = new Client({
    intents: ["Guilds", "GuildMessages", "MessageContent"]
});

// Événement déclenché lorsque le bot est prêt
client.once("ready", client => {
    // Définition de l'activité du bot
    client.user.setActivity(ACTIVITY_NAME, { type: ACTIVITY_TYPE });
    console.log(`Prêt ! Connecté en tant que ${client.user.tag}`);
});

// Événement déclenché lorsqu'un message est envoyé
client.on("messageCreate", async message => {
    // Vérification que le message n'est pas envoyé par un bot et qu'il n'est pas vide
    if (message.author.bot || !message.content) return;
    // Vérification que le bot est mentionné dans le message ou que le message est envoyé dans un salon autorisé
    if (!message.mentions.has(client.user) && !CHANNELS.includes(message.channelId)) return;

    // Définition de l'objet chatCompletion pour l'appel à l'API OpenAI
    const chatCompletion = { model: MODEL };
    chatCompletion.messages = [{ role: "system", content: PROMPT }];

    // Envoi d'une indication que le bot est en train d'écrire
    await message.channel.sendTyping();

    // Récupération de l'historique des messages du salon
    const messages = await message.channel.messages.fetch({ limit: HISTORY_LENGTH });

    // Ajout des messages à l'objet chatCompletion
    messages.reverse().each(msg => {
        // Si le message a été envoyé par un autre bot ou est vide, on passe au suivant
        if ((msg.author.bot && msg.author.id !== client.user.id) || !msg.content) return;

        chatCompletion.messages.push({
            role: msg.author.bot ? "assistant" : "user",
            content: msg.content,
            name: msg.author.id
        });
    });

    // Envoi de la réponse générée par ChatGPT
    message.reply((await openai.chat.completions.create(chatCompletion)).choices[0].message.content);
});

// Connexion du client Discord avec le jeton d'accès
client.login(process.env.DISCORD_TOKEN);
