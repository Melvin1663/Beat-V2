const formatDuration = value => {
    const seconds = Number(value);
    if (!Number.isFinite(seconds)) return '00:00';

    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60).toString().padStart(2, '0');
    const remaining = (total % 60).toString().padStart(2, '0');

    return hours ? `${hours}:${minutes}:${remaining}` : `${minutes}:${remaining}`;
};

const parseDuration = value => {
    if (typeof value !== 'string' || !/^\d+:\d{1,2}(?::\d{1,2})?$/.test(value)) return 'Invalid Time';

    const parts = value.split(':').map(Number);
    return parts.length === 2
        ? parts[0] * 60 + parts[1]
        : parts[0] * 3600 + parts[1] * 60 + parts[2];
};

const relativeTime = value => {
    const difference = new Date(value).getTime() - Date.now();
    const units = [
        ['year', 31536000000],
        ['month', 2592000000],
        ['day', 86400000],
        ['hour', 3600000],
        ['minute', 60000],
        ['second', 1000]
    ];
    const [unit, size] = units.find(([, unitSize]) => Math.abs(difference) >= unitSize) || units.at(-1);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(difference / size), unit);
};

if (require.main === module) {
    const assert = require('node:assert/strict');
    assert.equal(formatDuration(3723), '1:02:03');
    assert.equal(parseDuration('1:02:03'), 3723);
}

module.exports = { formatDuration, parseDuration, relativeTime };
