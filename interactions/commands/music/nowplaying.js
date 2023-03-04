const hhmmss = require('hhmmss');
const pb = require('../../../functions/progressBar');
const hhmmssToSec = require('hhmmsstosec');

module.exports = {
    name: 'nowplaying',
    description: 'Tells you what song is currently playing',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.connection || !q.songs.length) return int.reply("❌ There are no Songs in the queue");

            let song = q.songs[0];
            let curDur = q.connection?.state?.subscription?.player?.state?.resource?.playbackDuration;
            let totalDur = song.duration != 'LIVE' ? hhmmssToSec(song.duration) : curDur / 1000;
            let embed = new Discord.EmbedBuilder()
                .setAuthor({ name: 'Now Playing', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                .setColor('Green')
                .setThumbnail(song.img)
                .setTitle(song.title)
                .setTimestamp(song.uploaded)
                .setURL(song.url)
                .addFields(
                    { name: 'Artist', value: `[${song.artist}](${song.artistLink})`, inline: true },
                    { name: 'Duration', value: song.duration, inline: true },
                    { name: 'Requested by', value: song.req.toString(), inline: true },
                    { name: 'Views', value: song.views, inline: true },
                    { name: 'Age Restricted', value: song.ageRestricted ? 'Yes' : 'No', inline: true },
                    { name: 'Likes', value: song.likes, inline: true },
                    {
                        name: 'Current Duration',
                        value: `\`${hhmmss(curDur / 1000)}\` ${pb('🔘', '▬', Math.round((((curDur / 1000) + song.startedAt) / totalDur) * 19), 20)} \`${song.duration}\``
                    }
                )
                .setFooter({ text: song.ago || '0 seconds ago' })

            int.reply({ embeds: [embed] }).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}