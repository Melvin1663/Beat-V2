const moment = require('moment');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');
const descape = require('discord-escape');
const pdl = require('play-dl');
const ffmpeg = require('ffmpeg');
const get = require('node-fetch2');
const fs = require('fs');
const { promisify } = require('util');
const { pipeline } = require('stream');
const sp = promisify(pipeline);

module.exports = async (query, client, int, extra) => {
    const url = query ? query.replace(/<(.+)>/g, "$1") : '';
    if (!url) return { code: 1, txt: '❌ No Query given' };

    try {
        if (extra == 'spotify-track') {
            console.log('test')
            if (pdl.is_expired()) await pdl.refreshToken();
            const tracks = await pdl.search(query, { source: { spotify: 'track' } });
            if (!tracks.length) return { code: 1, txt: '❌ No results found' };
            const songInfo = tracks[0];
            const yt_tracks = await pdl.search(`${songInfo.artists.map(a => a.name).join(' + ')} - ${songInfo.name}`, { source: { youtube: 'video' }, limit: 1 });
            if (!yt_tracks.length) return { code: 1, txt: '❌ No results found' };

            const yt_songInfo = yt_tracks[0];

            return {
                code: 0,
                txt: '✅ Success',
                res: {
                    type: 'spotify-track',
                    streamType: 'youtube-video',
                    streamURL: yt_songInfo.url,
                    inputType: 'ogg/opus',
                    infoReady: true,
                    id: songInfo.id,
                    title: descape(songInfo.name),
                    url: songInfo.url,
                    img: songInfo.thumbnail.url,
                    duration: hhmmss(songInfo.durationInSec),
                    req: int.user,
                    start: 0,
                    live: false,
                    startedAt: 0,
                    artist: descape(songInfo.artists.map(a => a.name).join(' + ')),
                    artistLink: songInfo.artists.map(a => a.url),
                    album: songInfo.album.name,
                    albumLink: `https://open.spotify.com/album/${songInfo.album.id}`,
                    explicit: songInfo.explicit
                }
            };

            // if playlist
        } else if (url.match(/https:\/\/cdn.discordapp.com\/ephemeral-attachments\/[0-9]+\/[0-9]+\/.+/gm)) {
            let req = await get(url);
            let dattach = int.options.getAttachment('song');
            let filePath = `temp/${dattach.id}.${url.split('.')[3]}`;

            await sp(req.body, fs.createWriteStream(filePath));
            let audioFile = await new ffmpeg(filePath);

            let songInfo = audioFile.metadata;

            return {
                code: 0,
                txt: '✅ Success',
                res: {
                    type: 'discord-attachment',
                    streamType: 'discord-attachment',
                    streamURL: url,
                    inputType: 'arbitrary',
                    stream: fs.createReadStream(filePath),
                    filePath: filePath,
                    infoReady: true,
                    id: dattach.id,
                    title: descape(songInfo.title || dattach.name || 'N/A'),
                    url: url,
                    img: 'https://cdn-icons-png.flaticon.com/512/1169/1169863.png',
                    duration: hhmmss(songInfo.duration.seconds),
                    ago: moment(Date.now()).fromNow(),
                    uploaded: Date.now(),
                    req: int.user,
                    start: 0,
                    live: false,
                    startedAt: 0,
                    artist: descape(songInfo.artist || 'N/A'),
                }
            };

            // if yt playlist
        } else if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            try {
                const playlist = await pdl.playlist_info(url, { incomplete: true }).catch(console.log);
                if (!playlist) return { code: 1, txt: '❌ No results found' }
                const videos = await playlist.videos;

                let vid_list = [];
                for (const video of videos) {
                    if (video.durationInSec < 43200000) {
                        vid_list.push({
                            type: 'youtube-playlist-video',
                            streamType: 'youtube-video',
                            streamURL: video.url,
                            inputType: 'ogg/opus',
                            infoReady: false,
                            title: descape(video.title),
                            id: video.id,
                            url: video.url,
                            duration: video.isLive ? 'LIVE' : hhmmss(video.durationInSec),
                            req: int.user,
                            live: video.isLive,
                        })
                    }
                }

                playlist.videos = vid_list;
                playlist.type = 'youtube-playlist';
                playlist.req = int.user;
                playlist.img = playlist.thumbnail.url;

                return { code: 0, txt: '✅ Success', res: playlist }
            } catch (e) {
                console.log(e);
                return { code: 4, txt: '❌ An Error occured' }
            }
            // if spotify playlist
        } else if (url.match(/^https?:\/\/open.spotify.com\/playlist(.*)$/)) {
            return { code: 2, txt: 'Ability to play spotify playlists is coming sooooooon' };
            // if spotify track
        } else if (url.match(/^https?:\/\/open.spotify.com\/track(.*)$/)) {
            return { code: 2, txt: 'Ability to play spotify tracks is coming soooooon' };
            // if youtube video url
        } else if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
            let song = await getVideoInfo(url, int);

            if (!song) return { code: 1, txt: '❌ Video unavailable' };

            if (!song.live && hhmmssToSec(song.duration) > 43200000) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
            return { code: 0, txt: '✅ Success', res: song };
            // search on youtube
        } else {
            let vids = await pdl.search(query, { source: { youtube: "video" }, limit: 1 });

            if (!vids.length) return { code: 1, txt: '❌ No Results' };

            let songInfo = vids[0];

            let song = {
                type: 'youtube-search',
                streamType: 'youtube-video',
                streamURL: songInfo.url,
                inputType: 'ogg/opus',
                id: songInfo.id,
                infoReady: false,
                url: songInfo.url,
                img: songInfo.thumbnails[songInfo.thumbnails.length - 1].url,
                duration: songInfo.live ? 'LIVE' : hhmmss(songInfo.durationInSec),
                req: int.user,
                artist: descape(songInfo.channel.name),
                artistLink: descape(songInfo.channel.url),
                live: songInfo.live
            };

            if (!song?.live && hhmmssToSec(song?.duration) > 43200000) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
            return { code: 0, txt: '✅ Success', res: song };
        }
    } catch (e) {
        console.log(e);
        return { code: 4, txt: '❌ An Error occured' }
    }
}

const getVideoInfo = async (url, int) => {
    let songInfo = await pdl.video_basic_info(url).catch(console.log);
    if (!songInfo) return null;

    let song = {
        type: 'youtube-url',
        streamType: 'youtube-video',
        streamURL: songInfo.video_details.url,
        inputType: 'ogg/opus',
        infoReady: true,
        id: songInfo.video_details.id,
        title: descape(songInfo.video_details.title),
        url: songInfo.video_details.url,
        img: songInfo.video_details.thumbnails[songInfo.video_details.thumbnails.length - 1].url,
        duration: songInfo.video_details.live ? 'LIVE' : hhmmss(songInfo.video_details.durationInSec),
        ago: moment(songInfo.video_details.uploadedAt, 'YYYY-MM-DD').fromNow(),
        uploaded: new Date(songInfo.video_details.uploadedAt).getTime(),
        views: songInfo.video_details.views.toLocaleString(),
        likes: songInfo.video_details.likes.toLocaleString(),
        req: int.user,
        start: 0,
        live: songInfo.video_details.live,
        startedAt: 0,
        artist: descape(songInfo.video_details.channel.name),
        artistLink: descape(songInfo.video_details.channel.url),
        ageRestricted: songInfo.video_details.discretionAdvised
    };

    return song;
}