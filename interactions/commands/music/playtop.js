module.exports = {
    name: 'playtop',
    description: 'Queue a song and places it as second in the queue',
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
            q.songs.splice(1, 0, q.songs.pop());
        } catch (e) {
            console.error(e);
        }
    }
}