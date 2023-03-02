module.exports = {
    name: 'move',
    description: 'Moves a song in the queue to a new position',
    options: [
        {
            name: 'old_position',
            description: 'Queue number of the song to be moved',
            type: 4,
            required: true
        },
        {
            name: 'new_position',
            description: 'The queue number the song will be moved to',
            type: 4,
            required: true
        },
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.songs.length) return int.reply('❌ No songs are playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);
            if (args[0] > q.songs.length || args[1] > q.songs.length) return int.reply(`❌ The queue is only \`${q.songs.length}\` songs long!`)
            if (args[0] == 1 || args[1] == 1) return int.reply('❌ You cannot move the currently playing song');

            let song = q.songs[args[0] - 1];

            require('../../../functions/move')(q.songs, args[0] - 1, args[1] - 1);

            return int.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({ name: "Song mover", iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setColor('Blue')
                        .setDescription(`[${song.title}](${song.url}) has been moved to position \`#${args[1]}\``)
                ]
            }).catch(console.log);
        } catch (e) {
            console.error(e)
        }
    }
}