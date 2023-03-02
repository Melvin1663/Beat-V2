const voice = require('@discordjs/voice');
const fs = require('fs')
const pdl = require('play-dl');

module.exports = async (int, client, Discord) => {
    try {
        let q = client.queue.get(int.guild.id);

        const player = voice.createAudioPlayer({
            behaviors: {
                noSubscriber: voice.NoSubscriberBehavior.Pause,
            },
        });

        player.on('idle', async () => {
            let a = 0

            // If no more songs in the queue
            if (!q.songs.length) {
                q.player?.removeAllListeners()
                q.player?.stop();
                client.queue.delete(int.guild.id);

                require('./clearTemp')();

                return a++;
            }

            // if song repeat is on
            if (q.repeat) { a++ };

            // if queue loop is on
            if (q.loop && !q.repeat) {
                let b = q.songs.shift();
                q.songs.push(b);
                a++
            };

            if (!a) {
                let s = q.songs.shift();

                if (s.type == 'discord-attachment') fs.unlink(s.stream, e => e ? console.error(e) : {});
            }

            if (!q.songs.length) {
                q.player.removeAllListeners()
                q.player.stop();
                client.queue.delete(int.guild.id);
                require('./clearTemp')();

                return;
            }

            let newSongInfo = q.songs[0];

            if (!q.songs[0].infoReady) {
                let resSong = await require('./getMusic')(q.songs[0].url, client, int);

                if (resSong) newSongInfo = resSong.res;
            }

            q.songs.forEach((s, i) => {
                if (s.type == 'discord-attachment' && i != 0) fs.unlink(s.stream, e => e ? console.error(e) : {});
            })

            q.songs[0] = newSongInfo;

            if (!q.songs[0].stream) q.songs[0].stream = await pdl.stream(q.songs[0].url, { quality: 2, discordPlayerCompatibility: true }).then(r => r.stream);

            await player.play(voice.createAudioResource(q.songs[0].stream, { inlineVolume: true, type: 'opus' }));
            q.connection.state.subscription.player.state.resource.volume.setVolume(q.volume);
        })

        let e = 0

        player.on('error', err => {
            console.error('[STREAM]' + err)
            e++;
            q.textChannel.send('An error occured while playing the song: ' + err.message)
            if (q.songs.length > 1) q.songs.shift();
            require('./clearTemp')();

            require('./play')(int, client, Discord)
        })

        if (e == 1) return;

        if (!q.songs.length) {
            q.player.removeAllListeners()
            q.player.stop();
            client.queue.delete(int.guild.id);

            require('./clearTemp')();
            return;
        }

        q.player = player;

        if (!q.songs[0].stream) q.songs[0].stream = await pdl.stream(q.songs[0].url, { quality: 2, discordPlayerCompatibility: true }).then(r => r.stream);

        await player.play(voice.createAudioResource(q.songs[0].stream, { inlineVolume: true, type: 'opus' }));

        q.connection.subscribe(player);
        q.connection.state.subscription.player.state.resource.volume.setVolume(q.volume)

        q.connection.on('disconnected', () => {
            q.connection?.destroy();
            player?.removeAllListeners();
            player?.stop();
            client.queue.delete(int.guild.id)

            require('./clearTemp')();
        })

        player.on('playing', async (oS, nS) => {
            if (oS.status == 'paused') return;
            if (oS.status == 'autopaused') return;

            if (!q.songs.length) {
                q.player.removeAllListeners()
                q.player.stop();
                client.queue.delete(int.guild.id);
                require('./clearTemp')();

                return;
            }

            let newSongInfo = q.songs[0];

            if (!q.songs[0].infoReady) {
                let resSong = await require('./getMusic')(q.songs[0].url, client, int);

                if (resSong) newSongInfo = resSong.res;
            }

            q.songs[0] = newSongInfo;

            let song = q.songs[0];
            if (!song) return;
            if (q.first == true || q.notify == true) {
                if (q.first == true) q.first = false;
                if (q.loop == false && q.repeat == false) {
                    let thing = new Discord.EmbedBuilder()
                        .setAuthor({ name: 'Now Playing', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setColor('Green')
                        .setThumbnail(song.img)
                        .setTitle(song.title)
                        .setURL(song.url)
                        .setTimestamp(song.uploaded)
                        .addFields(
                            { name: 'Artist', value: `[${song.artist}](${song.artistLink})`, inline: true },
                            { name: 'Duration', value: song.duration, inline: true },
                            { name: 'Requested by', value: song.req.toString(), inline: true },
                            { name: 'Views', value: song.views, inline: true },
                            { name: 'Age Restricted', value: song.ageRestricted ? 'Yes' : 'No', inline: true },
                            { name: 'Likes', value: song.likes, inline: true },
                        )
                        .setFooter({ text: song.ago || '0 seconds ago' })

                    if (int.replied) return int.channel.send({ embeds: [thing] }).catch(console.log)
                    else return int.editReply({ embeds: [thing] }).catch(console.log)
                }
            }
        })
    } catch (e) {
        console.log(e);
    }
}