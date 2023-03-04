const ytpl = require("ytpl");
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

module.exports = async (query, client, int) => {
    const url = query ? query.replace(/<(.+)>/g, "$1") : '';
    if (!url) return { code: 1, txt: '❌ No Query given' };

    try {
        if (url.match(/https:\/\/cdn.discordapp.com\/ephemeral-attachments\/[0-9]+\/[0-9]+\/.+/gm)) {
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
                    infoReady: true,
                    stream: filePath,
                    id: dattach.id,
                    title: descape(songInfo.title || dattach.name || 'N/A'),
                    url: url,
                    img: 'https://cdn-icons-png.flaticon.com/512/1169/1169863.png',
                    duration: hhmmss(songInfo.duration.seconds),
                    ago: moment(Date.now()).fromNow(),
                    uploaded: Date.now(),
                    views: 'N/A',
                    likes: 'N/A',
                    req: int.user,
                    start: 0,
                    live: false,
                    startedAt: 0,
                    artist: descape(songInfo.artist || 'N/A'),
                    artistLink: 'N/A',
                    ageRestricted: false,
                }
            };

            // if playlist
        } else if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            try {
                const playlist = await ytpl(url).catch(console.log)
                if (!playlist) return { code: 1, txt: '❌ No results found' }
                const videos = await playlist.items;

                let vid_list = [];
                for (const video of videos) {
                    if (video.isPlayable && !video.isLive) {
                        vid_list.push({
                            type: 'video',
                            infoReady: false,
                            id: video.id,
                            title: descape(video.title),
                            url: video.shortUrl,
                            img: video.bestThumbnail.url,
                            duration: video.isLive ? 'LIVE' : video.duration,
                            ago: '?',
                            views: '?',
                            likes: '?',
                            req: int.user,
                            start: 0,
                            live: video.isLive,
                            startedAt: 0,
                            artist: descape(video.author.name),
                            artistLink: video.author.url,
                            ageRestricted: false
                        })
                    }
                }

                return { code: 0, txt: '✅ Success', res: [vid_list, playlist] }
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
            if (song.live) return { code: 3, txt: '❌ Cannot play livestreams' };

            if (!song.live && hhmmssToSec(song.duration) > 43200000) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
            return { code: 0, txt: '✅ Success', res: song };
            // search on youtube
        } else {
            let vids = await pdl.search(query, { source: { youtube: "video" }, limit: 1 });

            if (!vids.length) return { code: 1, txt: '❌ No Results' };

            let songInfo = vids[0];

            if (songInfo.live) return { code: 3, txt: '❌ Cannot play livestreams' };

            let song = {
                type: 'video',
                infoReady: false,
                url: songInfo.url,
                duration: hhmmss(songInfo.durationInSec),
                live: songInfo.live
            };

            if (!song?.live && hhmmssToSec(song?.duration) > 43200000) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
            return { code: 0, txt: '✅ Success', res: song };
        }
    } catch (e) {
        console.log(e)
        return { code: 4, txt: '❌ An Error occured' }
    }
}

const getVideoInfo = async (url, int) => {
    let songInfo = await pdl.video_basic_info(url).catch(console.log);
    if (!songInfo) return null;

    let song = {
        type: 'video',
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