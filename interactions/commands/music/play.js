const voice = require('@discordjs/voice');
const pdl = require('play-dl');
const descape = require('discord-escape');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');
const embeds = require('../../../functions/embeds');

module.exports = {
    name: 'play',
    description: 'Play music in a Discord VC',
    options: [
        {
            name: 'song',
            description: 'YouTube search/URL | Spotify URL | Soundcloud URL',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args, extra) => {
        try {
            let q = client.queue.get(int.guild.id);
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);
            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            let music = await require('../../../functions/getMusic')(args[0], client, int, extra);
            if (music.code != 0) return int.editReply(music.txt || '❌ An error occured');
            if (q && q.songs.length > 0) {
                if (music.res.type == 'youtube-playlist' || music.res.type == 'spotify-playlist') q.songs.push(...music.res[music.res.type == 'spotify-playlist' ? 'tracks' : 'videos']);
                else q.songs.push(music.res);

                return int.editReply({ embeds: [embeds('aq', music.res)] }).catch(console.log);
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
                first: true,
                subscribed: false,
                events: false
            };

            if (music.res.type == 'youtube-playlist' || music.res.type == 'spotify-playlist') qConstruct.songs.push(...music.res[music.res.type == 'spotify-playlist' ? 'tracks' : 'videos']);
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
                    connection.on('stateChange', (old_state, new_state) => {
                        if (old_state.status === voice.VoiceConnectionStatus.Ready && new_state.status === voice.VoiceConnectionStatus.Connecting) {
                            connection.configureNetworking();
                        }
                    })
                    q.connection = connection;
                }

                if (music.res.type == 'youtube-playlist' || music.res.type == 'spotify-playlist') int.editReply({ embeds: [embeds('aq', music.res)] });

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