const fs = require('fs')

module.exports = {
    name: 'skip',
    description: 'Skip songs',
    options: [
        {
            name: 'amount',
            description: 'Skip how many songs?',
            type: 4,
            required: false
        }
    ],
    run: async (Discord, client, int, args) => {
        try {
            let q = client.queue.get(int.guild.id);
            if (!q) return int.reply('❌ There are no songs in the queue');
            let channel = int.member.voice.channel;
            if (!channel) return int.reply('❌ You need to be in a voice channel');
            if (q && int?.member?.voice?.channelId !== q.voiceChannel.id) return int.reply(`❌ You need to be in <#${q.voiceChannel.id}>`);
            if (args[0] > q.songs.length) return int.reply(`❌ There's only \`${q.songs.length}\` song${q.songs.length > 1 ? 's' : ''} in the queue`)

            let lSong;

            if (!args.length || args[0] == 1) lSong = q.songs.shift();
            else {
                lSong = q.songs[0];
                q.songs.splice(0, args[0]);
            }

            await require('../../../functions/play')(int, client, Discord);
            
            if (lSong.type == 'discord-attachment') fs.unlink(lSong.filePath, console.error);

            return int.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setAuthor({ name: "Song skipper", iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
                        .setColor('Blue')
                        .setDescription(args.length && args[0] != 1 ? `Skipped \`${args[0]}\` songs` : `Skipped [${lSong.title}](${lSong.url})`)
                ]
            }).catch(console.log);
        } catch (e) {
            console.error(e);
        }
    }
}