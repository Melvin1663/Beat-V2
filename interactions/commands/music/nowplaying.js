const hhmmss = require('hhmmss');
const pb = require('../../../functions/progressBar');
const hhmmssToSec = require('hhmmsstosec');
const embeds = require('../../../functions/embeds');

module.exports = {
    name: 'nowplaying',
    description: 'Tells you what song is currently playing',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.connection || !q.songs.length) return int.reply("❌ There are no songs in the queue");

            let song = q.songs[0];
            let curDur = q.connection?.state?.subscription?.player?.state?.resource?.playbackDuration;
            let totalDur = song.duration != 'LIVE' ? hhmmssToSec(song.duration) : curDur / 1000;

            int.reply({
                embeds: [
                    embeds('np', song).addFields({
                        name: 'Current Duration',
                        value: `\`${hhmmss(curDur / 1000)}\` ${pb('🔘', '▬', Math.round((((curDur / 1000) + song.startedAt) / totalDur) * 19), 20)} \`${song.duration}\``
                    })
                ]
            }).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}