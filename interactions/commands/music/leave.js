module.exports = {
    name: 'leave',
    description: 'Makes the bot leave the VC',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q) return int.reply("❌ I'm not even connected to any voice channels");

            let channel = int.member.voice.channel;

            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            let vc = await int.guild.channels.fetch(q.voiceChannel.id);

            if (!vc) return int.editReply('❌ Could not find the vc');

            if (!channel && vc.members.size > 1) return int.editReply(`❌ You need to be in <#${vc.id}>`);

            if (q) {
                q.connection?.destroy();
                q.player?.stop();
                client.queue.delete(int.guild.id)
                int.editReply(`👋 Left <#${vc.id}>`).catch(console.log);
            }
        } catch (e) {
            console.error(e);
        }
    }
}