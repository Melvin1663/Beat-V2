const pdl = require('play-dl');

module.exports = {
    name: 'playspotify',
    description: 'Play a spotify track in a Discord VC',
    options: [
        {
            name: 'track',
            description: 'Spotify search/URL',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        require('./play').run(Discord, client, int, args, 'spotify-track').catch(console.log);
    }
}