// 模板引擎专用
let { mergeOptions } = require('./options');


function getConfig(name) {
    const config = {
        'blade': './templates/blade',
    };
    if (config[name] === undefined) {
        throw new Error('未知html模板：' + name);
    }
    return require(config[name])();
}

function templateTag(name, options = {}) {
    return mergeOptions(options, getConfig(name));
}

module.exports = templateTag;
