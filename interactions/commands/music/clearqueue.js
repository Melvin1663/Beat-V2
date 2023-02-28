module.exports = {
    name: 'clearqueue',
    description: 'Clears the song queue',
    run: async (Discord, client, int, args) => {
        let q = client.queue.get(int.guild.id);
        if (!q || !q?.songs?.length) return int.reply('❌ There are no songs in the queue');

        let channel = int.member.voice.channel;
        if (!channel) return int.reply('❌ You need to be in a voice channel');

        if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

        let songCount = q.songs.length;

        q.player.removeAllListeners()
        q.player.stop();
        client.queue.delete(int.guild.id);

        int.editReply(`✅ Cleared \`${songCount}\` song${songCount > 1 ? 's' : ''}`).catch(console.log);
    }
}