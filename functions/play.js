const voice = require('@discordjs/voice');
const fs = require('fs')
const pdl = require('play-dl');
const obo = require('./overwriteObj');
const embeds = require('./embeds');

module.exports = async (int, client, Discord) => {
    try {
        let q = client.queue.get(int.guild.id);

        const player = voice.createAudioPlayer({
            behaviors: {
                noSubscriber: voice.NoSubscriberBehavior.Pause,
            },
        });

        if (!q.songs.length) {
            q.player.removeAllListeners()
            q.player.stop();
            client.queue.delete(int.guild.id);

            require('./clearTemp')();
            return;
        }

        q.player = player;

        if (!q.songs[0].stream) {
            if (q.songs[0].streamType == 'youtube-video') q.songs[0].stream = await pdl.stream(q.songs[0].streamURL, { quality: 2, discordPlayerCompatibility: true }).then(r => r.stream);
            else if (q.songs[0].streamType == 'discord-attachment') q.songs[0].stream = fs.createReadStream(`temp/${q.songs[0].id}.${q.songs[0].url.split('.')[3]}`)
        }

        await player.play(voice.createAudioResource(q.songs[0].stream, { inlineVolume: true, inputType: q.songs[0].inputType }));

        q.connection.subscribe(player);
        q.connection?.state?.subscription?.player?.state?.resource?.volume?.setVolume(q.volume)

        q.player.on('idle', async () => {
            let a = 0;

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
                a++;
            };

            if (!a) {
                let s = q.songs.shift();

                if (s.type == 'discord-attachment') fs.unlink(s.filePath, e => e ? console.error(e) : {});
            }

            require('./play.js')(int, client, Discord);
        })

        q.player.on('error', err => {
            console.error('[STREAM] ' + err)
            q.textChannel.send('An error occured while playing the song: ' + err.message)
            if (q.songs.length > 1) q.songs.shift();
            require('./clearTemp')();

            require('./play')(int, client, Discord)
        })

        q.player.on('playing', async (oS, nS) => {
            if (oS.status == 'paused') return;
            if (oS.status == 'autopaused') return;

            if (!q.songs.length) {
                q.player.removeAllListeners()
                q.player.stop();
                client.queue.delete(int.guild.id);
                require('./clearTemp')();

                return;
            }

            if (!q.playing) player.pause();

            let song = q.songs[0];

            if (!q.songs[0].infoReady) {
                let resSong = await require('./getMusic')(q.songs[0].url, client, int);

                if (resSong) newSongInfo = obo(q.songs[0], resSong.res);

                newSongInfo.infoReady = true;
            }

            q.songs[0] = song;

            if (!song) return;
            if (q.first == true || q.notify == true) {
                if (q.first == true) q.first = false;
                if (q.loop == false && q.repeat == false) {
                    let thing = embeds('np', song);

                    if (int.replied) return int.channel.send({ embeds: [thing] }).catch(console.log)
                    else return int.editReply({ embeds: [thing] }).catch(console.log)
                }
            }
        })

        if (!q.events) {
            q.events = true;

            q.connection.on('disconnected', () => {
                q.connection?.destroy();
                q.player?.removeAllListeners();
                q.player?.stop();
                client.queue.delete(int.guild.id)

                require('./clearTemp')();
            })
        }
    } catch (e) {
        console.log(e);
    }
}