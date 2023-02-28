const ytpl = require("ytpl");
const ytsr = require('ytsr');
const ytdl = require("ytdl-core");
const moment = require('moment');
const hhmmss = require('hhmmss');
const hhmmssToSec = require('hhmmsstosec');
const descape = require('discord-escape');
const pdl = require('play-dl');

module.exports = async (query, client, int) => {
    const url = query ? query.replace(/<(.+)>/g, "$1") : '';
    if (!url) return { code: 1, txt: '❌ No Query given' };

    try {
        // if playlist
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            try {
                const playlist = await ytpl(url).catch(console.log)
                if (!playlist) return { code: 1, txt: '❌ No results found' }
                const videos = await playlist.items;

                let vid_list = [];
                for (const video of videos) {
                    if (video.isPlayable) {
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
                            channel: descape(video.author.name),
                            channelLink: video.author.url,
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

            song.infoReady = true;

            if (!song.live && hhmmssToSec(song.duration) > 43200000) return { code: 3, txt: '❌ Song must be under 12 hours in length' };
            return { code: 0, txt: '✅ Success', res: song };
            // search on youtube
        } else {
            const filters1 = await ytsr.getFilters(query);
            const filter1 = filters1.get('Type').get('Video');
            let vids = await ytsr(filter1.url, { limit: 1 });

            if (!vids.items.length) return { code: 1, txt: '❌ No Results' };

            let songInfo = vids.items[0];

            let song = {
                type: 'video',
                infoReady: false,
                id: songInfo.id,
                title: descape(songInfo.title),
                url: songInfo.url,
                img: songInfo.bestThumbnail.url,
                duration: songInfo.isLive ? 'LIVE' : songInfo.duration,
                ago: songInfo.uploadedAt,
                uploaded: null,
                views: songInfo.views.toLocaleString(),
                likes: null,
                req: int.user,
                start: 0,
                live: songInfo.isLive,
                startedAt: 0,
                channel: descape(songInfo.author.name),
                channelLink: descape(songInfo.author.url),
                ageRestricted: null,
            }

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
        id: songInfo.video_details.id,
        title: descape(songInfo.video_details.title),
        url: songInfo.video_details.url,
        img: songInfo.video_details.thumbnails[songInfo.video_details.thumbnails.length - 1].url,
        duration: songInfo.video_details.live ? 'LIVE' : songInfo.video_details.durationRaw,
        ago: moment(songInfo.video_details.uploadedAt, 'YYYY-MM-DD').fromNow(),
        uploaded: new Date(songInfo.video_details.uploadedAt).getTime(),
        views: songInfo.video_details.views.toLocaleString(),
        likes: songInfo.video_details.likes.toLocaleString(),
        req: int.user,
        start: 0,
        live: songInfo.video_details.live,
        startedAt: 0,
        channel: descape(songInfo.video_details.channel.name),
        channelLink: descape(songInfo.video_details.channel.url),
        ageRestricted: songInfo.video_details.discretionAdvised,
    };

    return song;
}