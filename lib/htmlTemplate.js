// 模板引擎专用
let { mergeOptions } = require('./options');


function getConfig(name) {
    const config = {
        'blade': {
            htmlFileRule: 'php|html',
            htmlOptions: {
                customAttrSurround: [
                    [
                        /@\w+\([\s\S]*?\)/,
                        /@\w+/
                    ],
                ],
                ignoreCustomFragments: [
                    /@\w+(\s*\(([^()"']+|"([^"\\]+|\\.)*"|'([^'\\]+|\\.)*'|\(([^()"']+|"([^"\\]+|\\.)*"|'([^'\\]+|\\.)*'|\(([^()"']+|"([^"\\]+|\\.)*"|'([^'\\]+|\\.)*'|\(([^()"']+|"([^"\\]+|\\.)*"|'([^'\\]+|\\.)*')*\))*\))*\))*\))?/,
                    /\{\{("([^"\\]+|\\.)*"|'([^'\\]+|\\.)*'|[^"'}]+|\}[^}])+\}\}/,
                ],
            },
        }
    };
    if (config[name] === undefined) {
        throw new Error('未知html模板：' + name);
    }
    return config[name];
}


function templateTag(name, options = {}) {
    return mergeOptions(options, getConfig(name));
}

module.exports = templateTag;
