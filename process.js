const Discord = require('discord.js');
const client = new Discord.Client({
    intents: 3276799
})

require('dotenv').config();

client.interactions = {
    commands: {},
    context: {
        user: {},
        message: {}
    }
};
client.queue = new Map();

['event', 'interactions'].forEach(handler => {
    require(`./handlers/${handler}`)(client, Discord)
});

client.login(process.env.TOKEN)