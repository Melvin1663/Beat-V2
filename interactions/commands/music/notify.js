module.exports = {
    name: 'notify',
    description: 'Sends a message every time a new song plays',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q) return int.reply('❌ No songs are playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`)

            q.notify = q.notify ? false : true;

            return int.reply(`${q.notify ? '🔔' : '🔕'} Notifications has been turned ${q.notify ? 'on' : 'off'}`);
        } catch (e) {
            console.error(e);
        }
    }
}