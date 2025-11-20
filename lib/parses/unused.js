// 获取未使用的样式标识
let filesystem = require('../filesystem');
let { newCssAndHTMLIdentifiers } = require('./minifier');

function get_diff(source, target, mapping) {
    for (var key in source) {
        if (target[key] === undefined && mapping[key] === undefined) {
            mapping[key] = true;
        }
    }
}
function get_intersect(source, target, mapping) {
    for (var key in source) {
        if (target[key] !== undefined && mapping[key] === undefined) {
            mapping[key] = false;
        }
    }
}

async function importUnused(eachPaths, webOptions) {
    let [minifiers, cssOptions, htmlOptions, localization] = newCssAndHTMLIdentifiers(webOptions);
    await eachPaths(async function (type, pathname, sourceDir, targetDir, isSkip, downloadUrl) {
        let sourceFile = sourceDir + pathname;
        if (minifiers[type] !== undefined) {
            await minifiers[type](pathname, targetDir, filesystem.read(sourceFile), downloadUrl);
        }
    }, localization);

    // 计算交集
    get_intersect(htmlOptions['id'], htmlOptions['id-use'], webOptions.removeUnusedIds);
    get_diff(htmlOptions['id-use'], htmlOptions['id'], webOptions.removeUnusedIds);
    get_diff(cssOptions['id'], htmlOptions['id'], webOptions.removeUnusedIds);
    get_diff(htmlOptions['id'], cssOptions['id'], webOptions.removeUnusedIds);
    get_diff(cssOptions['class'], htmlOptions['class'], webOptions.removeUnusedClasses);
    get_diff(htmlOptions['class'], cssOptions['class'], webOptions.removeUnusedClasses);
    get_diff(cssOptions['var-def'], cssOptions['var-use'], webOptions.removeUnusedCssVars);
    get_diff(cssOptions['var-use'], cssOptions['var-def'], webOptions.removeUnusedCssVars);
    get_diff(cssOptions['tag'], htmlOptions['tag'], webOptions.removeUnusedCssTags);
    // 处理字体，动画等内容
    get_diff(cssOptions['font-def'], cssOptions['font-use'], webOptions.removeUnusedCssFonts);
    get_diff(cssOptions['font-use'], cssOptions['font-def'], webOptions.removeUnusedCssFonts);
    get_diff(cssOptions['keyframes-def'], cssOptions['keyframes-use'], webOptions.removeUnusedCssKeyframes);
    get_diff(cssOptions['keyframes-use'], cssOptions['keyframes-def'], webOptions.removeUnusedCssKeyframes);
}


module.exports = { importUnused }