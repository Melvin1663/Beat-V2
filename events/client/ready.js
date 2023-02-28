module.exports = async (Discord, client) => {
    console.log(`Logged in as ${client.user.tag}`);

    let aoi = [];
    for (let type in client.interactions) {
        switch (type) {
            case 'commands': {
                for (let cmdName in client.interactions[type]) {
                    let cmd = client.interactions[type][cmdName];
                    let cmdCopy = Object.assign({}, cmd)
                    delete cmdCopy.run;
                    aoi.push(cmdCopy)
                }
            }; break;
            case 'context': {
                for (let ctxType in client.interactions[type]) {
                    for (let ctxName in client.interactions[type][ctxType]) {
                        let ctx = client.interactions[type][ctxType][ctxName];
                        aoi.push({
                            name: ctx.name,
                            type: ctx.type.toUpperCase()
                        })
                    }
                }
            }; break;
        }
    }

    await client.guilds.cache.get('1032824163909509131')?.commands.set(aoi).then(r => {
        console.log(`${r.size} Interaction(s) loaded`);
    }).catch(console.log)
    client.user.setActivity('Kappug', { type: Discord.ActivityType.Watching })
}