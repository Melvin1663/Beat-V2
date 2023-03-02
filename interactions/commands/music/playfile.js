const voice = require('@discordjs/voice');
const descape = require('discord-escape');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');

module.exports = {
    name: 'playfile',
    description: 'Play an audio file in a Discord VC',
    options: [
        {
            name: 'song',
            description: 'Audio attachment',
            type: 11,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        require('./play').run(Discord, client, int, [int.options.getAttachment('song').attachment]).catch(console.log);
    }
}