const voice = require('@discordjs/voice');
const fs = require('node:fs');
const obo = require('./overwriteObj');
const embeds = require('./embeds');
const youtube = require('./youtube');

module.exports = async (int, client, Discord, startSeconds = 0, announce = true) => {
    try {
        const q = client.queue.get(int.guild.id);
        if (!q) return;

        const player = voice.createAudioPlayer({
            behaviors: {
                noSubscriber: voice.NoSubscriberBehavior.Pause
            }
        });

        if (!q.songs.length) {
            q.player?.removeAllListeners();
            q.player?.stop();
            client.queue.delete(int.guild.id);
            require('./clearTemp')();
            return;
        }

        q.player = player;
        const song = q.songs[0];
        song.startedAt = startSeconds;

        if (!song.streamURL) {
            const result = await youtube.searchMusic(`${song.artist} - ${song.title}`);
            if (!result) {
                q.songs.shift();
                q.textChannel.send(`❌ Unable to stream ${song.artist} - ${song.title}`).catch(console.log);
                return module.exports(int, client, Discord);
            }
            song.streamURL = youtube.videoUrl(result.youtubeId);
        }

        if (!song.stream) {
            if (song.streamType === 'youtube-video') song.stream = youtube.streamAudio(song.streamURL, startSeconds);
            else if (song.streamType === 'discord-attachment') song.stream = fs.createReadStream(song.filePath);
        }

        const stopQueue = () => {
            q.player?.removeAllListeners();
            q.player?.stop();
            client.queue.delete(int.guild.id);
            require('./clearTemp')();
        };

        player.on('stateChange', async (oldState, newState) => {
            if (q.player !== player) return;

            if (newState.status === voice.AudioPlayerStatus.Idle && oldState.status !== voice.AudioPlayerStatus.Idle) {
                let keepSong = false;

                if (!q.songs.length) return stopQueue();
                if (q.repeat) {
                    q.songs[0].stream = undefined;
                    keepSong = true;
                }
                if (q.loop && !q.repeat) {
                    const repeated = q.songs.shift();
                    repeated.stream = undefined;
                    q.songs.push(repeated);
                    keepSong = true;
                }

                if (!keepSong) {
                    const finished = q.songs.shift();
                    if (finished.type === 'discord-attachment') fs.unlink(finished.filePath, error => error && console.error(error));
                }

                return module.exports(int, client, Discord);
            }

            if (newState.status !== voice.AudioPlayerStatus.Playing || oldState.status === voice.AudioPlayerStatus.Paused || oldState.status === voice.AudioPlayerStatus.AutoPaused) return;
            if (!q.songs.length) return stopQueue();
            if (!q.playing) return player.pause();

            if (!q.songs[0].infoReady) {
                const result = await require('./getMusic')(q.songs[0].url, client, int);
                if (result?.res) q.songs[0] = obo(q.songs[0], result.res);
                q.songs[0].infoReady = true;
            }

            const current = q.songs[0];
            if (!current || (!q.first && !q.notify)) return;
            if (q.first) q.first = false;
            if (!q.loop && !q.repeat) {
                if (!announce) return;
                const embed = embeds('np', current);
                if (int.replied) return int.channel.send({ embeds: [embed] }).catch(console.log);
                return int.editReply({ embeds: [embed] }).catch(console.log);
            }
        });

        player.on('error', error => {
            console.error('[STREAM] ' + error);
            q.textChannel.send('An error occured while playing the song: ' + error.message).catch(console.log);
            if (q.songs.length > 1) q.songs.shift();
            require('./clearTemp')();
            module.exports(int, client, Discord);
        });

        if (!q.events) {
            q.events = true;
            q.connection.on('disconnected', () => {
                q.connection?.destroy();
                q.player?.removeAllListeners();
                q.player?.stop();
                client.queue.delete(int.guild.id);
                require('./clearTemp')();
            });
        }

        q.connection.subscribe(player);
        player.play(voice.createAudioResource(song.stream, {
            inlineVolume: true,
            inputType: song.inputType
        }));
        q.connection?.state?.subscription?.player?.state?.resource?.volume?.setVolume(q.volume);
    } catch (error) {
        console.log(error);
    }
};
