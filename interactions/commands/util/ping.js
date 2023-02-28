module.exports = {
    name: 'ping',
    description: 'Bot latency',
    run: async (Discord, client, int, args) => {
        let intNow = Date.now();
        if (!int.deffered && !int.replied) await int.deferReply().catch(console.log)
        
        return int.editReply(`Msg: \`${Math.abs(intNow - int.createdTimestamp)}ms\`\nWS: \`${client.ws.ping}ms\``).catch(console.log)
    }
}