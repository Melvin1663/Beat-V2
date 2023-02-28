const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');

module.exports = {
    name: 'queue',
    description: 'Tells you what songs are in the queue',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id)
            if (!q || !q.songs.length) return int.reply('❌ There are no songs in the queue');
            let songs = require('../../../functions/genQ')(q, 1);
            let tsl = q.songs.reduce((a, b) => a + hhmmssToSec(b.duration), 0);

            let embed = new Discord.EmbedBuilder()
                .setAuthor({ name: 'Server songs queue', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                .setColor('FF55FF')
                .setDescription(songs.join('\n'))
                .setThumbnail(int.guild.iconURL({ dynamic: true, size: 1024 }))
                .addFields(
                    { name: 'Now Playing', value: `[${q.songs[0].title}](${q.songs[0].url})`, inline: true },
                    { name: 'Text Channel', value: q.textChannel.toString(), inline: true },
                    { name: 'Voice Channel', value: q.voiceChannel.toString(), inline: true },
                    { name: 'Volume', value: `🎧 ${Math.trunc(q.volume * 100)}%`, inline: true },
                    { name: 'Length', value: `⏱ ${hhmmss(tsl)}`, inline: true },
                    { name: 'Songs', value: `🎶 ${q.songs.length.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: `Notifs: ${q.notify ? '✅' : '❌'} | Loop Queue: ${q.loop ? '✅' : '❌'} | Loop Track: ${q.repeat ? '✅' : '❌'} | Playing: ${q.playing ? '✅' : '❌'}` })

            let comps = [];

            comps.push(
                new Discord.ActionRowBuilder()
                    .addComponents(
                        [
                            new Discord.ButtonBuilder()
                                .setStyle('Primary')
                                .setEmoji(`<:arrow_left_2:876016893343973386>`)
                                .setCustomId(JSON.stringify({
                                    cmd: 'queue',
                                    do: 'changePage',
                                    data: 'left2'
                                }))
                                .setDisabled()
                            ,
                            new Discord.ButtonBuilder()
                                .setStyle('Primary')
                                .setEmoji('<:arrow_left:876016893226545153>')
                                .setCustomId(JSON.stringify({
                                    cmd: 'queue',
                                    do: 'changePage',
                                    data: 'left'
                                }))
                                .setDisabled()
                            ,
                            new Discord.ButtonBuilder()
                                .setStyle('Primary')
                                .setEmoji('<:arrow_right:876016892962295840>')
                                .setCustomId(JSON.stringify({
                                    cmd: 'queue',
                                    do: 'changePage',
                                    data: 'right'
                                }))
                            ,
                            new Discord.ButtonBuilder()
                                .setStyle('Primary')
                                .setEmoji('<:arrow_right_2:876016893402705941>')
                                .setCustomId(JSON.stringify({
                                    cmd: 'queue',
                                    do: 'changePage',
                                    data: 'right2'
                                }))
                        ]
                    )
            )

            if (~~(q.songs.length / 10) == 0 ? 1 : ~~(q.songs.length / 10) == 1) {
                comps[0].components[2].data.disabled = true;
                comps[0].components[3].data.disabled = true;
            }

            int.reply({ content: ` Page **1**/**${~~(q.songs.length / 10) + (~~(q.songs.length % 10) ? 1 : 0)}**`, embeds: [embed], components: comps }).catch(console.log)
        } catch (e) {
            console.error(e);
        }
    }
}