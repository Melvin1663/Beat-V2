const Discord = require('discord.js');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');

module.exports = (style, data) => {
    let base = new Discord.EmbedBuilder()
        .setAuthor({ name: style == 'np' ? 'Now Playing' : 'Added to queue', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
        .setColor(style == 'np' ? 'Green' : 'Yellow' || 'Default')
        .setThumbnail(data.img || null)
        .setTitle(data.title || null)
        .setURL(data.url || null)
        .setTimestamp(data.uploaded || null)
        .setFooter({ text: data.ago || null })

    switch (data.type) {
        case 'spotify-track': base.addFields(
            { name: 'Artist', value: data.artist.split(' + ').map((a, i) => `[${a}](${data.artistLink[i]})`).join(' + '), inline: true },
            { name: 'Requested by', value: data.req?.toString(), inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: 'Album', value: data.album ? `[${data.album}](${data.albumLink})` : 'N/A', inline: true },
            { name: 'Duration', value: data.duration, inline: true },
            { name: 'Explicit', value: data.explicit ? 'Yes' : 'No' || 'N/A', inline: true }
        ); break;
        case 'discord-attachment': base.addFields(
            { name: 'Artist', value: data.artist, inline: true },
            { name: 'Duration', value: data.duration, inline: true },
            { name: 'Requested by', value: data.req.toString(), inline: true },
        ); break;
        case 'youtube-search':
        case 'youtube-playlist-video':
        case 'youtube-url': {
            if (data.infoReady) base.addFields(
                { name: 'Channel', value: `[${data.artist}](${data.artistLink})`, inline: true },
                { name: 'Duration', value: data.duration, inline: true },
                { name: 'Requested by', value: data.req.toString(), inline: true },
                { name: 'Views', value: data.views, inline: true },
                { name: 'Age Restricted', value: data.ageRestricted ? 'Yes' : 'No', inline: true },
                { name: 'Likes', value: data.likes, inline: true },
            )
            else base.addFields(
                { name: 'Artist', value: `[${data.artist}](${data.artistLink})`, inline: true },
                { name: 'Duration', value: data.duration, inline: true },
                { name: 'Requested by', value: data.req.toString(), inline: true },
            )
        }; break;
        case 'youtube-playlist': base.addFields(
            { name: 'Channel', value: `[${data.channel.name}](${data.channel.url})`, inline: true },
            { name: 'Duration', value: hhmmss(data.videos.reduce((a, b) => a + hhmmssToSec(b.duration), 0)) ?? 'N/A', inline: true },
            { name: 'Requested by', value: data.req.toString(), inline: true },
            { name: 'Visibility', value: data.visibility ?? 'N/A', inline: true },
            { name: 'Song/Playable Count', value: `${data.videos.length.toLocaleString()}/${data.videoCount.toLocaleString()}`, inline: true },
            { name: 'Views', value: data.views.toLocaleString(), inline: true }
        ); break;
    }

    return base;
}