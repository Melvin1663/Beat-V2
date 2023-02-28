module.exports = async (Discord, client, msg) => {
    if (msg.content.startsWith('.ping')) return msg.reply('pong')
}