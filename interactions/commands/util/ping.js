module.exports = {
    name: 'ping',
    description: 'Bot latency',
    run: async (Discord, client, int, args) => {
        return int.reply(`Msg: \`${Math.abs(Date.now() - int.createdTimestamp)}ms\`\nWS: \`${client.ws.ping}ms\``).catch(console.log)
    }
}