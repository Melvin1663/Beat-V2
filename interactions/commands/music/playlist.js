const pdl = require('play-dl');

module.exports = {
    name: 'playlist',
    description: 'Play a playlist in a Discord VC',
    options: [
        {
            name: 'playlist',
            description: 'Play a YT playlist (YT Playlist search/URL)',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            if (!int.deffered && !int.replied) await int.deferReply().catch(console.log);

            let playlists = await pdl.search(args[0], { source: { youtube: 'playlist' }, limit: 1 })

            if (!playlists.length) return int.editReply('❌ No Results');

            require('./play').run(Discord, client, int, [playlists[0].url]).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}