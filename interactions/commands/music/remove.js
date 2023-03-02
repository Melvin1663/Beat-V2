module.exports = {
    name: 'remove',
    description: 'Removes a song from the queue',
    options: [
        {
            name: 'position',
            description: 'Queue number of the song to be removed',
            type: 4,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q || !q.songs.length) return int.reply('❌ No songs are playing');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);
            if (args[0] > q.songs.length) return int.reply(`❌ The queue is only \`${q.songs.length}\` songs long!`)
            if (args[0] == 1) return require('./skip').run(Discord, client, int, args);

            let song = q.songs.splice(args[0] - 1, 1);

            return int.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({ name: "Song remover", iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setColor('Blue')
                        .setDescription(`Removed [${song[0].title}](${song[0].url}) from the queue`)
                ]
            }).catch(console.log);
        } catch (e) {
            console.error(e)
        }
    }
}