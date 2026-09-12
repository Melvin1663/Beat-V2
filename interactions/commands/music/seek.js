const { parseDuration } = require('../../../functions/time');

module.exports = {
    name: 'seek',
    description: 'Seeks to a position in the current song',
    options: [
        {
            name: 'time',
            description: 'Position such as 1:05 or 1:05:30',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            const q = client.queue.get(int.guild.id);
            const song = q?.songs?.[0];
            if (!q || !song) return int.reply('❌ There is no song playing');

            const channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (int.member.voice.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);
            if (song.streamType !== 'youtube-video' || song.live) return int.reply('❌ Only non-live YouTube songs can be seeked');

            const position = args[0] || '';
            const parts = position.split(':').map(Number);
            const seconds = parseDuration(position);
            if (!Number.isInteger(seconds) || parts.slice(1).some(part => part < 0 || part >= 60)) {
                return int.reply('❌ Use a time like `1:05` or `1:05:30`');
            }

            const duration = parseDuration(song.duration);
            if (Number.isInteger(duration) && seconds >= duration) return int.reply(`❌ Position must be before \`${song.duration}\``);

            if (!int.deferred && !int.replied) await int.deferReply().catch(console.log);

            q.player?.removeAllListeners();
            q.player?.stop();
            song.stream = undefined;

            await require('../../../functions/play')(int, client, Discord, seconds, false);
            return int.editReply(`⏩ Seeked to \`${position}\``).catch(console.log);
        } catch (error) {
            console.error(error);
            if (int.deferred || int.replied) return int.editReply('❌ Could not seek the current song').catch(console.log);
            return int.reply('❌ Could not seek the current song').catch(console.log);
        }
    }
};
