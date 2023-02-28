module.exports = async (Discord, client, int) => {
    if (!int) return;
    if (int.isCommand()) {
        let args = [];
        int.options.data.map((x, i) => {
            if (x.type == 'SUB_COMMAND') {
                int.options.data[i].options?.map(x => args.push(x.value));
            } else {
                args.push(x.value);
            }
        })

        try {
            if (client.interactions.commands[int.commandName]) return client.interactions.commands[int.commandName].run(Discord, client, int, args)
            else return int.reply({ content: 'Unknown command', ephemeral: true }).catch(console.log)
        } catch (e) {
            console.log(e);
            if (!int.deffered && !int.replied) int.reply(`Error: ${e.message}`).catch(console.log)
            else int.editReply(`Error: ${e.message}`).catch(console.log)
        }
        return;
    }
    if (int.isButton()) {
        let json = JSON.parse(int.customId);
        if (!json.cmd || !json.do) return int.reply("The Interaction contained incomplete information").catch(console.log)
        
        try {
            await require(`../../interactions/buttons/${json.cmd}/${json.do}`)(json, client, Discord, int)
        } catch (e) {
            console.log(e)
            if (!int.deffered && !int.replied) int.reply({ content: 'There was an error trying to execute the interaction', ephemeral: true }).catch(console.log)
            else int.editReply({ content: 'There was an error trying to execute the interaction', ephemeral: true }).catch(console.log)
        };
        return;
    }
    if (int.isContextMenuCommand()) {
        let cmd = client.interactions.context[int.targetType.toLowerCase()][int.commandName]
        if (cmd) return cmd.run(int, Discord, client);
        int.reply({ content: 'Unknown command', ephemeral: true }).catch(console.log)
    }
    if (int.isSelectMenu()) {
        let json = JSON.parse(int.customId);
        if (!json.cmd || !json.do) return int.reply("The Interaction contained incomplete information").catch(console.log)

        try {
            await require(`../../interactions/dropdowns/${json.cmd}/${json.do}`)(json, client, Discord, int)
        } catch (e) {
            console.log(e)
            if (!int.deffered && !int.replied) int.reply({ content: 'There was an error trying to execute the interaction', ephemeral: true }).catch(console.log)
            else int.editReply({ content: 'There was an error trying to execute the interaction', ephemeral: true }).catch(console.log)
        };
        return;
    }
}