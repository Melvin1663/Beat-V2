const youtube = require('../../../functions/youtube');

module.exports = {
    name: 'playlist',
    description: 'Play a YouTube playlist in a Discord VC',
    options: [
        {
            name: 'playlist',
            description: 'YouTube playlist URL or search',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let url = args[0];
            if (!youtube.isYouTubeUrl(url)) {
                const result = await youtube.searchPlaylist(url);
                if (!result) return int.reply('❌ No Results');
                url = `https://www.youtube.com/playlist?list=${result.playlistId}`;
            }

            return require('./play').run(Discord, client, int, [url]).catch(console.log);
        } catch (error) {
            console.error(error);
        }
    }
};
