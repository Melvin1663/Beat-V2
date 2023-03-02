const fs = require('fs');

module.exports = () => {
    fs.readdir('temp/', (err, files) => {
        if (err) return console.error(err);

        files.forEach(f => f != 'placeholder' ? fs.unlink(`temp/${f}`, e => e ? console.error(e) : {}) : {});
    });
}