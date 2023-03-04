module.exports = {
    name: 'replay',
    description: 'Replays the song to the first second',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.songs.length) return int.reply('❌ No Song is playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`)

            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            q.songs[0].stream = undefined;
            await require('../../../functions/play')(int, client, Discord);

            return int.editReply('🔄 Replayed');
        } catch (e) {
            console.error(e)
        }
    }
}