module.exports = {
    name: 'shuffle',
    description: 'Shuffles the queue',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.songs.length) return int.reply('❌ No songs are playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`)
            if (q.songs.length < 2) return int.reply('❌ 2 songs or more are required to shuffle the queue')

            for (i = q.songs.length - 1; i > 1; i--) {
                let j = 1 + Math.floor(Math.random() * i);
                [q.songs[i], q.songs[j]] = [q.songs[j], q.songs[i]];
            }

            return int.reply('🔀 Shuffled the queue').catch(console.log);
        } catch (e) {
            console.error(e)
        }
    }
}