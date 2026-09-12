const pb = require('../../../functions/progressBar');
const { formatDuration, parseDuration } = require('../../../functions/time');
const embeds = require('../../../functions/embeds');

module.exports = {
    name: 'nowplaying',
    description: 'Tells you what song is currently playing',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.connection || !q.songs.length) return int.reply("❌ There are no songs in the queue");

            let song = q.songs[0];
            let playback = Number(q.connection?.state?.subscription?.player?.state?.resource?.playbackDuration) || 0;
            let curDur = playback / 1000 + (Number(song.startedAt) || 0);
            let totalDur = song.duration != 'LIVE' ? parseDuration(song.duration) : curDur;
            let progress = Number.isFinite(totalDur) && totalDur > 0
                ? Math.min(19, Math.max(1, Math.round(curDur / totalDur * 19)))
                : 1;

            int.reply({
                embeds: [
                    embeds('np', song).addFields({
                        name: 'Current Duration',
                        value: `\`${formatDuration(curDur)}\` ${pb('🔘', '▬', progress, 20)} \`${song.duration}\``
                    })
                ]
            }).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}
