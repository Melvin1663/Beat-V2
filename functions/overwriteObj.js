module.exports = (o, n, e) => {
    if (o) for (i in n) if (o[i] == undefined || e?.includes(i)) o[i] = n[i]

    return o;
}