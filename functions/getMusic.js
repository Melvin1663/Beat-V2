const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');
const escape = require('./escape');
const { formatDuration, parseDuration, relativeTime } = require('./time');
const readAudioMetadata = require('./mediaMetadata');
const youtube = require('./youtube');

const MAX_DURATION = 43200000;

const formatNumber = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : 'N/A';

const parseUploadDate = value => value && value.length === 8
    ? new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`)
    : value;

const makeSong = (info, int, type, infoReady) => {
    const id = info.id || info.youtubeId;
    const url = info.webpage_url || info.url || youtube.videoUrl(id);
    const live = Boolean(info.is_live || info.live_status === 'is_live' || info.live);
    const artist = info.channel || info.uploader || info.artists?.map(a => a.name).join(' + ') || 'YouTube';
    const artistLink = info.channel_url || info.uploader_url || (info.channel_id && `https://www.youtube.com/channel/${info.channel_id}`) || (infoReady ? url : undefined);
    const duration = info.duration?.totalSeconds ?? info.duration;
    const image = info.thumbnail || info.thumbnailUrl || info.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    return {
        type,
        streamType: 'youtube-video',
        streamURL: youtube.videoUrl(id),
        inputType: 'ogg/opus',
        infoReady,
        id,
        title: escape(info.title || 'N/A'),
        url,
        img: image,
        duration: live ? 'LIVE' : formatDuration(duration),
        req: int.user,
        start: 0,
        live,
        startedAt: 0,
        artist: escape(artist),
        artistLink,
        ago: info.upload_date ? relativeTime(parseUploadDate(info.upload_date)) : undefined,
        uploaded: info.timestamp ? info.timestamp * 1000 : undefined,
        views: info.view_count == null ? (infoReady ? 'N/A' : undefined) : formatNumber(info.view_count),
        likes: info.like_count == null ? (infoReady ? 'N/A' : undefined) : formatNumber(info.like_count),
        ageRestricted: info.age_limit == null ? (infoReady ? false : undefined) : Number(info.age_limit) >= 18
    };
};

const getVideoInfo = async (url, int) => {
    const info = await youtube.info(url, { noPlaylist: true }).catch(() => null);
    return info?.id ? makeSong(info, int, 'youtube-url', true) : null;
};

const getPlaylistInfo = async (url, int) => {
    const info = await youtube.info(url, { flatPlaylist: true });
    const videos = (info.entries || [])
        .filter(video => video?.id)
        .map(video => makeSong(video, int, 'youtube-playlist-video', false));

    return {
        type: 'youtube-playlist',
        title: escape(info.title || info.id || 'YouTube playlist'),
        url,
        img: info.thumbnail || videos[0]?.img,
        channel: {
            name: escape(info.uploader || info.channel || 'YouTube'),
            url: info.uploader_url || info.channel_url || url
        },
        visibility: info.availability || 'N/A',
        videoCount: Number(info.playlist_count) || videos.length,
        views: Number(info.view_count) || 0,
        req: int.user,
        videos
    };
};

module.exports = async (query, client, int) => {
    const url = query ? query.replace(/<(.+)>/g, '$1') : '';
    if (!url) return { code: 1, txt: '❌ No Query given' };

    try {
        if (/^https:\/\/cdn\.discordapp\.com\/ephemeral-attachments\/[0-9]+\/[0-9]+\/.+/i.test(url)) {
            const response = await fetch(url);
            if (!response.ok || !response.body) throw new Error(`Attachment request failed: ${response.status}`);

            const attachment = int.options.getAttachment('song');
            const extension = path.extname(new URL(url).pathname).slice(1) || 'audio';
            const filePath = path.join('temp', `${attachment.id}.${extension}`);
            await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(filePath));

            const metadata = await readAudioMetadata(filePath);
            return {
                code: 0,
                txt: '✅ Success',
                res: {
                    type: 'discord-attachment',
                    streamType: 'discord-attachment',
                    streamURL: url,
                    inputType: 'arbitrary',
                    stream: fs.createReadStream(filePath),
                    filePath,
                    infoReady: true,
                    id: attachment.id,
                    title: escape(metadata.title || attachment.name || 'N/A'),
                    url,
                    img: 'https://cdn-icons-png.flaticon.com/512/1169/1169863.png',
                    duration: formatDuration(metadata.duration.seconds),
                    ago: relativeTime(Date.now()),
                    uploaded: Date.now(),
                    req: int.user,
                    start: 0,
                    live: false,
                    startedAt: 0,
                    artist: escape(metadata.artist || 'N/A')
                }
            };
        }

        if (youtube.isYouTubeUrl(url) && youtube.isPlaylistUrl(url)) {
            const playlist = await getPlaylistInfo(url, int);
            return playlist.videos.length
                ? { code: 0, txt: '✅ Success', res: playlist }
                : { code: 1, txt: '❌ No results found' };
        }

        if (youtube.isYouTubeUrl(url)) {
            const song = await getVideoInfo(url, int);
            if (!song) return { code: 1, txt: '❌ Video unavailable' };
            if (!song.live && parseDuration(song.duration) > MAX_DURATION) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
            return { code: 0, txt: '✅ Success', res: song };
        }

        const result = await youtube.searchMusic(url);
        if (!result) return { code: 1, txt: '❌ No Results' };

        const song = makeSong({
            id: result.youtubeId,
            title: result.title,
            artists: result.artists,
            thumbnailUrl: result.thumbnailUrl,
            duration: result.duration,
            url: youtube.videoUrl(result.youtubeId)
        }, int, 'youtube-search', false);
        if (!song.live && parseDuration(song.duration) > MAX_DURATION) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
        return { code: 0, txt: '✅ Success', res: song };
    } catch (error) {
        console.error(error);
        return { code: 4, txt: '❌ An Error occured' };
    }
};
