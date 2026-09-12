const { spawn } = require('node:child_process');
const ffmpeg = require('ffmpeg-static');

module.exports = filePath => new Promise((resolve, reject) => {
    const process = spawn(ffmpeg, ['-hide_banner', '-i', filePath, '-f', 'ffmetadata', 'pipe:1'], {
        windowsHide: true
    });
    let metadata = '';
    let stderr = '';

    process.stdout.on('data', chunk => metadata += chunk);
    process.stderr.on('data', chunk => stderr += chunk);
    process.on('error', reject);
    process.on('close', code => {
        if (code !== 0) return reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));

        const duration = stderr.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/);
        const tags = Object.fromEntries(metadata.split(/\r?\n/)
            .slice(1)
            .filter(line => line.includes('='))
            .map(line => line.split(/=(.*)/s)));

        resolve({
            title: tags.title,
            artist: tags.artist,
            duration: {
                seconds: duration
                    ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])
                    : 0
            }
        });
    });
});
