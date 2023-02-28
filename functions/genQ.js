module.exports = (q, page) => {
    if (!q?.songs?.length) return [];
    let pages = ~~(q.songs.length / 10) + (~~(q.songs.length % 10) ? 1 : 0);
    if (page > pages) page = pages;
    if (page < 0) page = 1;

    let res = q.songs.map((song, i) => `\`${i + 1}\` | [${song.title}](${song.url})`)

    res = res.splice(page * 10 - 10, 10);

    return res;
}