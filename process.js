const Discord = require('discord.js');
const pdl = require('play-dl');
const fs = require('fs');
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

if (fs.existsSync('.data/spotify.data')) {
    (async () => {
        await pdl.setToken(JSON.parse(fs.readFileSync('.data/spotify.data', { encoding: 'utf-8' }))).catch(console.log);
    })()
}

client.login(process.env.TOKEN)