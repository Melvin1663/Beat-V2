const voice = require('@discordjs/voice');
const descape = require('discord-escape');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');

module.exports = {
    name: 'play',
    description: 'Play Music in a Discord VC',
    options: [
        {
            name: 'song',
            description: 'YouTube/Spotify URL/Keyword',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);

            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            let music = await require('../../../functions/getMusic')(args[0], client, int);
            if (music.code != 0) return int.editReply(music.txt || '❌ An error occured');
            if (q && q.songs.length > 0) {
                let isPlaylist = false
                let song;
                if (music.res.length) {
                    q.songs.push(...music.res[0]);
                    isPlaylist = true;
                    song = music.res[0][0];
                }
                else {
                    q.songs.push(music.res);
                    song = music.res
                }

                let thing;

                if (isPlaylist) {
                    let pl = music.res[1];
                    let totalDur = music.res[0].reduce((a, b) => a + hhmmssToSec(b.duration), 0);

                    thing = new Discord.EmbedBuilder()
                        .setAuthor({ name: 'Added to Queue', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setColor('Yellow')
                        .setThumbnail(pl.bestThumbnail.url)
                        .setTitle(descape(pl.title))
                        .setURL(pl.url)
                        .addFields(
                            { name: 'Channel', value: `[${pl.author.name}](${pl.author.url})`, inline: true },
                            { name: 'Duration', value: hhmmss(totalDur) ?? '?', inline: true },
                            { name: 'Requested by', value: song.req.toString(), inline: true },
                            { name: 'Visibility', value: pl.visibility ?? '?', inline: true },
                            { name: 'Song Count', value: pl.items.length, inline: true },
                            { name: 'Views', value: pl.views.toLocaleString(), inline: true }
                        )
                        .setFooter({ text: pl.lastUpdated || '0 seconds ago' })
                } else thing = new Discord.EmbedBuilder()
                    .setAuthor({ name: 'Added to Queue', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                    .setColor('Yellow')
                    .setThumbnail(song.img)
                    .setTitle(song.title)
                    .setURL(song.url)
                    .setTimestamp(song.uploaded)
                    .addFields(
                        { name: 'Channel', value: `[${song.channel}](${song.channelLink})`, inline: true },
                        { name: 'Duration', value: song.duration, inline: true },
                        { name: 'Views', value: song.views, inline: true },
                        { name: 'Requested by', value: song.req.toString(), inline: true },
                    )
                    .setFooter({ text: song.ago || '0 seconds ago' })

                return int.editReply({ embeds: [thing] }).catch(console.log);
            }

            const qConstruct = {
                textChannel: int.channel,
                voiceChannel: channel,
                connection: null,
                player: null,
                songs: [],
                volume: 1,
                playing: true,
                loop: false,
                repeat: false,
                notify: true,
                first: true
            };

            if (music.res.length) qConstruct.songs.push(...music.res[0]);
            else qConstruct.songs.push(music.res);
            client.queue.set(int.guild.id, qConstruct);

            try {
                let q = client.queue.get(int.guild.id)
                if (!q.connection) {
                    const connection = voice.joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    });
                    q.connection = connection;
                }

                if (music.res.length) {
                    let pl = music.res[1];
                    let totalDur = music.res[0].reduce((a, b) => a + hhmmssToSec(b.duration), 0);

                    const song = q.songs[0];

                    let thing = new Discord.EmbedBuilder()
                        .setAuthor({ name: 'Added to Queue', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setColor('Yellow')
                        .setThumbnail(pl.bestThumbnail.url)
                        .setTitle(descape(pl.title))
                        .setURL(pl.url)
                        .addFields(
                            { name: 'Channel', value: `[${pl.author.name}](${pl.author.url})`, inline: true },
                            { name: 'Duration', value: hhmmss(totalDur) ?? '?', inline: true },
                            { name: 'Requested by', value: song.req.toString(), inline: true },
                            { name: 'Visibility', value: pl.visibility ?? '?', inline: true },
                            { name: 'Song Count', value: pl.items.length.toLocaleString(), inline: true },
                            { name: 'Views', value: pl.views.toLocaleString(), inline: true }
                        )
                        .setFooter({ text: pl.lastUpdated || '0 seconds ago' })

                    int.editReply({ embeds: [thing] });
                }

                await require('../../../functions/play')(int, client, Discord)
            } catch (e) {
                client.queue.get(int.guild.id).connection?.destroy();
                client.queue.delete(int.guild.id);
                console.log(e);
            }
        } catch (e) {
            console.error(e);
        }
    }
}