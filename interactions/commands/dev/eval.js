const util = require('util');
const { create } = require('sourcebin');

module.exports = {
    name: 'eval',
    description: 'Evaluate JS Code (Dangerous)',
    default_member_permissions: 1 << 3,
    options: [
        {
            name: 'code',
            description: 'The code being evaluated',
            type: 3,
            required: true
        }
    ],
    run: async (Discord, client, int, args) => {
        let perm = 0;
        if (int.user.id == '731765420897599519') perm++;

        if (perm == 0) return int.reply({ content: 'No Sufficient Permission', ephemeral: true });

        if (!int.deffered && !int.replied) await int.deferReply().catch(console.log)

        try {
            let code = args[0];
            let time = Date.now();
            let res = util.inspect(await eval(code, { depth: 0 }), { maxArrayLength: null, maxStringLength: null });
            let time2 = Date.now()
            if (res.length > 1000) {
                let src = await create({
                    title: 'Eval',
                    description: args[0],
                    files: [
                        {
                            content: res.replaceAll(process.env.TOKEN, '{r-token}'),
                            language: 'javascript'
                        }
                    ]
                })
                return int.editReply(`Evaluated in \`${time2 - time}ms\`\n<${src.url}>`);
            }
            return int.editReply(`Evaluated in \`${time2 - time}ms\`\n\`\`\`js\n${res.replaceAll(process.env.TOKEN, '{r-token}')}\`\`\``);
        } catch (e) {
            console.log(e);
            return int.editReply(`\`\`\`diff\n${e}\`\`\``);
        }
    }
}