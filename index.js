const child = require('child_process');
const get = require('node-fetch2');

const runProcess = () => {
    let bot = child.spawn('node', ['process.js']);

    bot.stdout.on('data', (data) => {
        console.log(data.toString().trim());
        sendWebhook(data.toString().trim());
    });

    bot.stderr.on('data', (data) => {
        console.log(data.toString().trim());
        sendWebhook(data.toString().trim());
    });

    bot.on('close', (code) => {
        console.log(`Process exited with code ${code}`)
        if (code > 0) {
            console.log('Restarting...');

            runProcess();
        } else process.exit();
    })
}

const sendWebhook = (msg) => {
    const whurl = process.env.WHURL;

    get(whurl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: msg })
    });
}

runProcess();