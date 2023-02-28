module.exports = (em0, em1, pos, max) => {
    if (pos <= 0) pos = 1
    if (max > 1000) return "Max Cells is 1000"
    let bar = [];
    for (let i = 1; i < max - 1; i++) bar.push(em1)
    bar.splice(pos - 1, 0, em0);

    return bar.join('')
}