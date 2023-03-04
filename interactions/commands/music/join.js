const voice = require('@discordjs/voice');

module.exports = {
    name: 'join',
    description: 'Makes the bot join a VC',
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (q) return int.channel.send(`❌ I'm already connected to <#${q.voiceChannel.id}>`)
            let channel = int.member.voice.channel;
            if (!channel) return int.channel.send('❌ You need to be in a voice channel');

            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            let connection = await voice.joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            connection.on('stateChange', (old_state, new_state) => {
                if (old_state.status === voice.VoiceConnectionStatus.Ready && new_state.status === voice.VoiceConnectionStatus.Connecting) {
                    connection.configureNetworking();
                }
            })

            const qConstruct = {
                textChannel: int.channel,
                voiceChannel: channel,
                connection: connection,
                player: null,
                songs: [],
                volume: 1,
                playing: true,
                loop: false,
                repeat: false,
                notify: true,
                first: true,
                subscribed: false,
                events: false,
                temp: {}
            };

            client.queue.set(int.guild.id, qConstruct);

            int.editReply(`👋 Joined <#${qConstruct.voiceChannel.id}>`).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}