const getLyrics = require('../../../functions/lyrics');

module.exports = {
    name: 'lyrics',
    description: 'Searches for the song lyrics',
    options: [
        {
            name: 'song',
            description: 'Song title',
            type: 3,
            required: false
        },
        {
            name: 'artist',
            description: 'Song artist',
            type: 3,
            required: false
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            let song = q?.songs?.[0];

            if (!args[0] && !song) return int.reply('❌ No song specified');

            let title = args[0] || song.title;
            let artist = args[0] ? args[1] : song.artist;

            if (!int.deferred && !int.replied) await int.deferReply().catch(console.log);

            let lyric = await getLyrics(title, artist);

            if (!lyric) return int.editReply(`❌ No lyrics found for **${title}**`);

            let embed = new Discord.EmbedBuilder()
                .setColor('Random')
                .setFooter({ text: `Requested by ${int.user.tag}`, iconURL: int.user.displayAvatarURL() })
                .setTitle(`Lyrics: ${title}`)
                .setDescription(lyric.length >= 4093 ? lyric.substring(0, 4093) + '...' : lyric)

            return int.editReply({ embeds: [embed] }).catch(console.log);
        } catch (e) {
            console.error(e);
            if (int.deferred || int.replied) return int.editReply('❌ Could not retrieve lyrics').catch(console.log);
            return int.reply('❌ Could not retrieve lyrics').catch(console.log);
        }
    }
}
