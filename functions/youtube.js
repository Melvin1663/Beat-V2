const { spawn } = require('node:child_process');
const { PassThrough } = require('node:stream');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('ffmpeg-static');

let musicApi;

const loadMusicApi = () => musicApi ??= import('@monka75/node-youtube-music');
const videoUrl = id => `https://www.youtube.com/watch?v=${id}`;

const videoId = value => {
    try {
        const url = new URL(value);
        if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') return url.pathname.slice(1).split('/')[0];
        return url.searchParams.get('v') || url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] || null;
    } catch {
        return null;
    }
};

const isYouTubeUrl = value => {
    try {
        const hostname = new URL(value).hostname.replace(/^www\./, '');
        return ['youtube.com', 'music.youtube.com', 'm.youtube.com', 'youtu.be'].includes(hostname);
    } catch {
        return false;
    }
};

const isPlaylistUrl = value => {
    try {
        const url = new URL(value);
        return url.pathname === '/playlist' || (url.searchParams.has('list') && !videoId(value));
    } catch {
        return false;
    }
};

const info = (url, options = {}) => youtubedl(url, {
    dumpSingleJson: true,
    skipDownload: true,
    noWarnings: true,
    quiet: true,
    ...options
});

const searchMusic = async query => {
    const { searchMusics } = await loadMusicApi();
    return (await searchMusics(query)).find(song => song.youtubeId);
};

const searchPlaylist = async query => {
    const { searchPlaylists } = await loadMusicApi();
    return (await searchPlaylists(query)).find(playlist => playlist.playlistId);
};

const streamAudio = (url, startSeconds = 0) => {
    if (!ffmpeg) throw new Error('ffmpeg is not available');

    const seek = Number(startSeconds);

    const extractor = youtubedl.exec(url, {
        output: '-',
        format: 'bestaudio[abr<=256]/bestaudio',
        noPlaylist: true,
        noProgress: true,
        noWarnings: true,
        quiet: true
    });
    const transcoder = spawn(ffmpeg, [
        '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0',
        ...(Number.isFinite(seek) && seek > 0 ? ['-ss', String(seek)] : []),
        '-vn', '-c:a', 'libopus', '-b:a', '256k', '-vbr', 'on',
        '-application', 'audio', '-f', 'ogg', 'pipe:1'
    ], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const output = new PassThrough();
    let ended = false;
    let stderr = '';
    const fail = error => {
        if (!ended && !output.destroyed) output.destroy(error instanceof Error ? error : new Error(String(error)));
    };

    extractor.stdout.pipe(transcoder.stdin);
    extractor.stdout.on('error', fail);
    extractor.stderr?.on('data', chunk => {
        stderr = `${stderr}${chunk}`.slice(-4096);
    });
    extractor.on('error', fail);
    extractor.on('close', code => {
        if (code && !output.destroyed) fail(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });
    extractor.catch(error => fail(error)).catch(() => {});

    transcoder.stdin.on('error', () => {});
    transcoder.stdout.on('data', chunk => output.write(chunk));
    transcoder.stdout.on('end', () => {
        ended = true;
        output.end();
    });
    transcoder.stdout.on('error', fail);
    transcoder.stderr.on('data', chunk => {
        stderr = `${stderr}${chunk}`.slice(-4096);
    });
    transcoder.on('error', fail);
    transcoder.on('close', code => {
        if (code && !output.destroyed) fail(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });

    output.on('close', () => {
        if (ended) return;
        extractor.kill();
        transcoder.kill();
    });

    return output;
};

module.exports = { info, isPlaylistUrl, isYouTubeUrl, searchMusic, searchPlaylist, streamAudio, videoId, videoUrl };
