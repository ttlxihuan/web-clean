/**
 * 整站（js、css、html）压缩工具
 * 主要压缩内容：
 *  js
 *      去掉所有注释&空格，去掉所有无用代码，优化代码结构，简化掉所有局部变量名
 *  html
 *      去掉所有注释&空格，简化掉所有class和id名（允许指定不简化名集合），提取所有style属性合并到style标签中，提取所有style标签并合并压缩
 *  css|sass
 *      去掉所有注释&空格，去掉所有无用代码，优化或合并代码，简化掉所有class和id名（允许指定不简化名集合）
 */

const path = require('path');
const { URL } = require('url');
let filesystem = require('./filesystem');
let { makeOptions } = require('./options');
let templateTag = require('./htmlTemplate');
let { createMinifier } = require('./minify');
let { importUnused } = require('./parses/unused');
let { importControl } = require('./parses/control');
let { createLocalization } = require('./parses/localization');

// 生成文件匹配正则
function makeFileRule(fileRule) {
    if (fileRule instanceof RegExp) {
        return fileRule;
    }
    return new RegExp('\\.(' + fileRule.replace(/[^\w\|]/, '\\$0') + ')$', 'i');
}

/**
 * web清理
 */
function WebClean(webOptions = {}, templateName = null) {
    if (templateName) {
        webOptions = templateTag(templateName, webOptions);
    }
    webOptions = makeOptions(webOptions);
    let handle, paths = [];
    let fileRules = {};
    ['css', 'js', 'html'].forEach(name => {
        fileRules[name] = makeFileRule(webOptions[name + 'FileRule']);
    });
    let otherFileRules = {};
    ['skip', 'ignore'].forEach(name => {
        let key = name + 'FileRule';
        otherFileRules[name] = webOptions[key] ? makeFileRule(webOptions[key]) : { test: () => false };
    });
    function convertUrl(pathname) {
        if (webOptions.baseUrl) {
            let url = new URL(webOptions.baseUrl);
            url.pathname = String((/\.[^\.\/]+$/.test(url.pathname) ? path.dirname(url.pathname) : url.pathname) + pathname).replace(/\/\/+/g, '/');
            url.hash = null;
            url.search = null;
            return url.href;
        }
        return false;
    }

    async function eachPaths(callback, localization) {
        let { ignore, skip } = otherFileRules;
        let strorage_files = {};
        async function dispatch(pathname, sourceDir, targetDir, downloadUrl = null) {
            let targetFile = targetDir + pathname;
            // 这里需要防止死循环复制
            if (strorage_files[targetFile] !== undefined) {
                return;
            }
            strorage_files[targetFile] = 1;
            if (ignore.test(pathname)) {
                return;
            }
            let isSkip = skip.test(pathname);
            try {
                for (var key in fileRules) {
                    if (fileRules[key].test(pathname)) {
                        await callback(key, pathname, sourceDir, targetDir, isSkip, downloadUrl);
                        return;
                    }
                }
                await callback('other', pathname, sourceDir, targetDir, isSkip, downloadUrl);
            } catch (e) {
                console.error('[error-file] ' + sourceDir + pathname);
                throw e;
            }
        }
        for (var next, file, iterator, key = 0; key < paths.length; key++) {
            var { sourceDir, targetDir } = paths[key];
            iterator = filesystem.scan(sourceDir);
            while (!(next = iterator.next(), file = next.value, next.done)) {
                var pathname = file.substring(sourceDir.length);
                await dispatch(pathname, sourceDir, targetDir, convertUrl(pathname));
                await localization.waitAllDownload();
            }
        }
        for (let key = 0; key < localization.resourceFileMappings.length; key++) {
            var [downloadUrl, downloadDir, targetDir, pathname] = localization.resourceFileMappings[key];
            await dispatch(pathname, downloadDir, targetDir, downloadUrl || convertUrl(pathname));
            await localization.waitAllDownload();
        }
    }

    // 执行压缩处理
    async function run() {
        if (webOptions.skipControlCss || otherFileRules.skip instanceof RegExp) {
            console.info('[Collect] skip control -------------------------------------------------//');
            await importControl(eachPaths, webOptions);
        }
        // 删除未使用的class、id、var
        if (webOptions.cleanUnused) {
            console.info('[Collect] unused identifiers -------------------------------------------------//');
            await importUnused(eachPaths, webOptions);
        }
        console.info('[minify] -------------------------------------------------//');
        let localization = createLocalization(webOptions);
        let minifiers = createMinifier(webOptions, localization.dynamicOptions);
        let minifyNum = 0, copyNum = 0, rates = 0;
        await eachPaths(async function (type, pathname, sourceDir, targetDir, isSkip, downloadUrl) {
            let sourceFile = sourceDir + pathname;
            if (type !== 'html') {
                pathname = localization.mangleResourceFileIdentifier(pathname);
                if (!webOptions.absolutePath) {
                    pathname = '/' + pathname;
                }
            }
            let targetFile = targetDir + pathname;
            if (!isSkip && minifiers[type] !== undefined) {
                console.info('[minify] ' + sourceFile + ' => ' + targetFile);
                rates += await minifiers[type](pathname, targetDir, filesystem.read(sourceFile), downloadUrl, true);
                minifyNum++;
            } else {
                console.info('[copy] ' + sourceFile + ' => ' + targetFile);
                filesystem.copy(sourceFile, targetFile);
                copyNum++;
            }
        }, localization);
        console.info('[finish] minify: ' + minifyNum + ', copy: ' + copyNum + ', total: ' + (minifyNum + copyNum) + ', minify-rate: ' + (rates / minifyNum * 100).toFixed(2) + '%');
    }
    function addLoader(fileRule, loader) {
        loaders.push({
            reg: makeFileRule(fileRule),
            loader: loader,
        });
        return handle;
    };

    function addPath(sourceDir, targetDir) {
        filesystem.mkdirs(targetDir)
        sourceDir = filesystem.realpath(sourceDir);
        targetDir = filesystem.realpath(targetDir);
        paths.push({
            sourceDir,
            targetDir
        });
        return handle;
    }
    handle = { run, addPath, addLoader }

    return handle;
}

module.exports = WebClean;
