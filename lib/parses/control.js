// 提取跳过混淆或删除的样式标识
const path = require('path');
let filesystem = require('../filesystem');
let { newCssAndHTMLIdentifiers } = require('./minifier');

function getFileName(sourceFile) {
    let name = path.basename(sourceFile);
    return name.replace(/([-\.]min[-\.])?\.[^\.]+$/i, '');
}

function toConfig(identifiers, mapping, value = null) {
    for (var key in identifiers) {
        if (mapping[key] === undefined) {
            mapping[key] = value === null ? key : value;
        }
    }
}

async function importControl(eachPaths, webOptions) {
    let cssFiles = {};
    let jsFiles = {};
    let [minifiers, cssOptions, htmlOptions, localization] = newCssAndHTMLIdentifiers(webOptions);

    await eachPaths(async function (type, pathname, sourceDir, targetDir, isSkip, downloadUrl) {
        if (minifiers[type] !== undefined) {
            let sourceFile = sourceDir + pathname;
            if (isSkip) {
                await minifiers[type](pathname, targetDir, filesystem.read(sourceFile), downloadUrl);
            } else if (type === 'css') {
                cssFiles[getFileName(pathname)] = async function () {
                    await minifiers.css(pathname, targetDir, filesystem.read(sourceFile), downloadUrl);
                };
            }
        } else if (type === 'css') {
            jsFiles[getFileName(pathname)] = 1;
        }
    }, localization);
    // 判断是否为控件样式文件
    if (webOptions.skipControlCss) {
        for (var name in cssFiles) {
            if (jsFiles[name] === undefined) {
                continue;
            }
            await cssFiles[name]();
        }
    }

    if (webOptions.cleanUnused) {
        toConfig(htmlOptions['id'], webOptions.removeUnusedIds, false);
        toConfig(htmlOptions['id-use'], webOptions.removeUnusedIds, false);
        toConfig(htmlOptions['class'], webOptions.removeUnusedClasses, false);
        toConfig(htmlOptions['tag'], webOptions.removeUnusedCssTags, false);
        toConfig(cssOptions['id'], webOptions.removeUnusedIds, false);
        toConfig(cssOptions['class'], webOptions.removeUnusedClasses, false);
        toConfig(cssOptions['tag'], webOptions.removeUnusedCssTags, false);
        toConfig(cssOptions['var-def'], webOptions.removeUnusedCssVars, false);
        toConfig(cssOptions['var-use'], webOptions.removeUnusedCssVars, false);
        toConfig(cssOptions['font-def'], webOptions.removeUnusedCssFonts, false);
        toConfig(cssOptions['font-use'], webOptions.removeUnusedCssFonts, false);
        toConfig(cssOptions['keyframes-def'], webOptions.removeUnusedCssKeyframes, false);
        toConfig(cssOptions['keyframes-use'], webOptions.removeUnusedCssKeyframes, false);
    }
    if (webOptions.mangleClassIdentifiers !== false) {
        toConfig(htmlOptions['class'], webOptions.mangleClassIdentifiers);
        toConfig(cssOptions['class'], webOptions.mangleClassIdentifiers);
    }
    if (webOptions.mangleIdIdentifiers !== false) {
        toConfig(htmlOptions['id'], webOptions.mangleIdIdentifiers);
        toConfig(htmlOptions['id-use'], webOptions.mangleIdIdentifiers);
        toConfig(cssOptions['id'], webOptions.mangleIdIdentifiers);
    }
    if (webOptions.mangleCssVarIdentifiers !== false) {
        toConfig(cssOptions['var-def'], webOptions.mangleCssVarIdentifiers);
        toConfig(cssOptions['var-use'], webOptions.mangleCssVarIdentifiers);
    }
    if (webOptions.mangleCssKeyframesIdentifiers !== false) {
        toConfig(cssOptions['keyframes-def'], webOptions.mangleCssKeyframesIdentifiers);
        toConfig(cssOptions['keyframes-use'], webOptions.mangleCssKeyframesIdentifiers);
    }
    if (webOptions.mangleCssFontIdentifiers !== false) {
        toConfig(cssOptions['font-def'], webOptions.mangleCssFontIdentifiers);
        toConfig(cssOptions['font-use'], webOptions.mangleCssFontIdentifiers);
    }
}

module.exports = { importControl }