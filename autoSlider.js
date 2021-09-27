const fs = require('fs');
const { join } = require('path');

const getSlider = (path = './docs') => {
    const dir = fs.readdirSync(path);
    const files = [];
    const dirs = [];
    dir.forEach((p) => {
        const state = fs.statSync(join(path, p));
        if (state.isFile() && p.endsWith('.md')) {
            files.push(p);
            return;
        }
        if (state.isDirectory() && p !== '.vuepress') {
            dirs.push(p);
        }
    });
    const f = files.map(p => {
        if(p === 'README.md')  {
            p = '';
        }
        return [path, p].join('/').replace('./docs', '');
    });
    const d = dirs.map(p => {
        return {
            title: p,
            children: getSlider([path, p].join('/'))
        }
    });

    return f.concat(d);
};

module.exports = getSlider;