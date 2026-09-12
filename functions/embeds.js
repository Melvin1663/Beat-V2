const Discord = require('discord.js');
const { formatDuration, parseDuration } = require('./time');

module.exports = (style, data) => {
    const base = new Discord.EmbedBuilder()
        .setAuthor({ name: style == 'np' ? 'Now Playing' : 'Added to queue', iconURL: 'https://i.imgur.com/5I8C0jo.gif' })
        .setColor(style == 'np' ? 'Green' : 'Yellow' || 'Default')
        .setThumbnail(data.img || null)
        .setTitle(data.title || null)
        .setURL(data.url || null)
        .setTimestamp(data.uploaded || null)
        .setFooter({ text: data.ago || null });

    switch (data.type) {
        case 'discord-attachment': base.addFields(
            { name: 'Artist', value: data.artist, inline: true },
            { name: 'Duration', value: data.duration, inline: true },
            { name: 'Requested by', value: data.req.toString(), inline: true }
        ); break;
        case 'youtube-search':
        case 'youtube-playlist-video':
        case 'youtube-url': {
            if (data.infoReady) base.addFields(
                { name: 'Channel', value: data.artistLink ? `[${data.artist}](${data.artistLink})` : data.artist, inline: true },
                { name: 'Duration', value: data.duration, inline: true },
                { name: 'Requested by', value: data.req.toString(), inline: true },
                { name: 'Views', value: data.views, inline: true },
                { name: 'Age Restricted', value: data.ageRestricted ? 'Yes' : 'No', inline: true },
                { name: 'Likes', value: data.likes, inline: true }
            );
            else base.addFields(
                { name: 'Channel', value: data.artistLink ? `[${data.artist}](${data.artistLink})` : data.artist, inline: true },
                { name: 'Duration', value: data.duration, inline: true },
                { name: 'Requested by', value: data.req.toString(), inline: true }
            );
        }; break;
        case 'youtube-playlist': base.addFields(
            { name: 'Channel', value: `[${data.channel.name}](${data.channel.url})`, inline: true },
            { name: 'Duration', value: formatDuration(data.videos.reduce((a, b) => a + (Number(parseDuration(b.duration)) || 0), 0)) ?? 'N/A', inline: true },
            { name: 'Requested by', value: data.req.toString(), inline: true },
            { name: 'Visibility', value: data.visibility ?? 'N/A', inline: true },
            { name: 'Playable/Song count', value: `${data.videos.length.toLocaleString()}/${data.videoCount.toLocaleString()}`, inline: true },
            { name: 'Views', value: data.views.toLocaleString(), inline: true }
        ); break;
    }

    return base;
};
