/**
 * 内置压缩处理
 */
const sass = require('sass');
const CleanCSS = require('clean-css');
let filesystem = require('./filesystem');
const { minify: jsMinify } = require('terser');
const { minify: htmlMinify } = require('html-minifier-terser');

const minifiers = {
    css: cssMinifier,
    js: jsMinifier,
    html: htmlMinifier,
};
// 包装成可解析的css代码
function wrapCSS(text, type) {
    switch (type) {
        case 'inline':
            return '*{' + text + '}';
        case 'media':
            return '@media ' + text + '{*{top:0}}';
        default:
            return text;
    }
}
// 提取出需要的css代码
function unwrapCSS(text, type) {
    let matches;
    switch (type) {
        case 'inline':
            matches = text.match(/^\*\{([\s\S]*)\}$/);
            break;
        case 'media':
            matches = text.match(/^@media ([\s\S]*?)\s*{[\s\S]*}$/);
            break;
    }
    return matches ? matches[1] : text;
}
// 创建压缩处理器
function createMinifier(webOptions, dynamicOptions = null) {
    let minifierLoaders = {};
    Object.keys(minifiers).forEach(function (name) {
        let key = name + 'Options';
        if (webOptions[key] !== undefined) {
            minifierLoaders[name] = parseLoader(webOptions, key, minifiers[name], function (pathname, targetDir, options, downloadUrl) {
                if (name === 'html' && minifierLoaders.css) {
                    options.minifyCSS = async function (text, type) {
                        if (/^\s*$/.test(text)) {
                            return '';
                        }
                        return unwrapCSS(await minifierLoaders.css(pathname, targetDir, wrapCSS(text, type), downloadUrl), type);
                    };
                } else if (name === 'js' && webOptions.makeSourceMap) {
                    options.sourceMap = {
                        asObject: false,
                        filename: path.basename(pathname) + '.map',
                    };
                } else if (name === 'css' && webOptions.makeSourceMap) {
                    options.sourceMap = path.basename(pathname) + '.map';
                }
                if (typeof dynamicOptions !== 'function') {
                    return options;
                }
                return dynamicOptions(name, pathname, targetDir, options, downloadUrl);
            });
        }
    });
    return minifierLoaders;
}
// 创建加载器
function parseLoader(webOptions, type, minifier, dynamicOptions) {
    let loader, options = webOptions[type];
    if (typeof (options) === 'function') {
        loader = options;
    } else if (typeof (options) === 'object') {
        loader = minifier(webOptions);
    }
    if (typeof loader !== 'function') {
        loader = (code) => code;
    }
    if (typeof dynamicOptions !== 'function') {
        dynamicOptions = () => options;
    }
    return async function (pathname, targetDir, code, downloadUrl = null, save = false) {
        let targetFile;
        if (save) {
            targetFile = targetDir + pathname;
        };
        let [minifierCode, mapCode] = await loader(code, dynamicOptions(pathname, targetDir, options, downloadUrl));
        if (save) {
            filesystem.write(targetFile, minifierCode);
            if (mapCode) {
                filesystem.write(targetFile + '.map', mapCode);
            }
            return minifierCode.length / code.length;
        } else {
            return minifierCode;
        }
    };
}
// js 压缩处理器
function jsMinifier(webOptions) {
    return async function (code, options) {
        let result = await jsMinify(code, options);
        let mapping = null;
        if (webOptions.makeSourceMap) {
            mapping = String(result.map);
        }
        return [result.code, mapping];
    };
}
// css 压缩处理器
function cssMinifier(webOptions) {
    return async function (code, options) {
        let result = new CleanCSS(options).minify(sass.compileString(code).css);
        let mapping = null;
        if (webOptions.makeSourceMap) {
            mapping = String(result.sourceMap) + "\n/*# sourceMappingURL=" + options.sourceMap + " */";
        }
        return [result.styles, mapping];
    };
}
// html 压缩处理器
function htmlMinifier(webOptions) {
    return async function (code, options) {
        return [await htmlMinify(code, options), null];
    };
}

module.exports = { createMinifier }