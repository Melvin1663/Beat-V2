const lyrics = require('lyrics-finder');

module.exports = {
    name: 'lyrics',
    description: 'Searches for the song lyrics',
    options: [
        {
            name: 'song',
            description: 'Song title',
            type: 3,
            required: false
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id)

            if (!args[0] && !q) return int.reply('❌ No song specified');
            else if (!args.length && q) args[0] = q.songs[0].title

            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            let lyric = await lyrics(args[0]);

            if (!lyric) return int.editReply(`❌ No lyrics found for **${args[0]}**`)

            let embed = new Discord.EmbedBuilder()
                .setColor('Random')
                .setFooter({ text: `Requested by ${int.user.tag}`, iconURL: int.user.displayAvatarURL() })
                .setTitle(`Lyrics: ${args[0]}`)
                .setDescription(lyric.length >= 4093 ? lyric.substring(0, 4093) + '...' : lyric)

            return int.editReply({ embeds: [embed] }).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}