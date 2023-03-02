const voice = require('@discordjs/voice');
const descape = require('discord-escape');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');

module.exports = {
    name: 'playskip',
    description: 'Queue a song and skip the currently playing song',
    options: [
        {
            name: 'song',
            description: 'YouTube/Spotify URL/Keyword',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.songs.length) return int.reply('❌ No songs are playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);

            await require('./play').run(Discord, client, int, args);
            q.songs.shift();
            await require('../../../functions/play')(int, client, Discord);
        } catch (e) {
            console.error(e);
        }
    }
}