module.exports = {
    name: 'loop',
    description: 'Loops songs',
    options: [
        {
            name: 'queue',
            type: 1,
            description: 'Loop the queue',
        },
        {
            name: 'track',
            type: 1,
            description: 'Loop the current song',
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q) return int.reply('❌ No Songs are playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);

            if (int.options._subcommand == 'queue') {
                q.loop = !q.loop;
                int.reply(`🔁 ${q.loop ? 'Now' : 'No longer'} looping the queue`);
            } else if (int.options._subcommand == 'track') {
                q.repeat = !q.repeat;
                int.reply(`🔁 ${q.repeat ? 'Now' : 'No longer'} looping the track`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}