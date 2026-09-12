const API_URL = 'https://lrclib.net/api';

const clean = value => String(value ?? '')
    .replace(/\\([_*~`|\\<>:!])/g, '$1')
    .replace(/@\u200b/g, '@')
    .trim();

const lyricsText = data => {
    const result = Array.isArray(data)
        ? data.find(track => track.plainLyrics || track.syncedLyrics)
        : data;
    const lyrics = result?.plainLyrics || result?.syncedLyrics;

    return lyrics
        ?.replace(/\r/g, '')
        .replace(/^(?:\[\d{1,2}:\d{2}(?:[.:]\d{2,3})?\]\s*)+/gm, '')
        .trim() || null;
};

const fetchLyrics = async url => {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Beat V2 Discord music bot' },
            signal: AbortSignal.timeout(10000)
        });

        return response.ok ? lyricsText(await response.json()) : null;
    } catch {
        return null;
    }
};

module.exports = async (title, artist) => {
    const trackName = clean(title);
    const artistName = clean(artist);
    if (!trackName) return null;

    if (artistName) {
        const exact = new URL(`${API_URL}/get`);
        exact.search = new URLSearchParams({ artist_name: artistName, track_name: trackName });

        const lyrics = await fetchLyrics(exact);
        if (lyrics) return lyrics;
    }

    const search = new URL(`${API_URL}/search`);
    search.search = new URLSearchParams({ q: [artistName, trackName].filter(Boolean).join(' ') });
    return fetchLyrics(search);
};
