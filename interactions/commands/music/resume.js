module.exports = {
    name: 'resume',
    description: 'Resumes the currently paused song',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.songs.length) return int.reply('❌ No Song is playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`)
            if (q.playing) return int.reply('❌ Song is already playing');

            q.player?.unpause();
            q.playing = true;
            return int.reply('▶ Unpaused').catch(console.log);
        } catch (e) {
            console.error(e)
        }
    }
}