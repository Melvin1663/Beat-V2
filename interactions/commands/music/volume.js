module.exports = {
    name: 'volume',
    description: 'Sets the volume of the player',
    options: [
        {
            name: 'level',
            description: 'The volume level (0-200)',
            type: 4,
            required: false
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.connection || !q.songs.length) return int.reply('❌ There are no songs in the queue');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);
            if (!args.length) return int.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({ name: 'Player volume', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setDescription(`🎧 Volume: **${~~(q.volume * 100)}**/200`)
                        .setColor('Green')
                ]
            })

            // if (args[0] < 0 || args[0] > 200) return int.reply("❌ You can only set the volume between 0 - 200");

            q.volume = args[0] / 100;
            q.connection.state.subscription.player.state.resource.volume.setVolume(q.volume);
            int.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({ name: 'Player volume', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setDescription(`🎧 Volume: **${~~(q.volume * 100)}**/200`)
                        .setColor('Blue')
                ]
            }).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}