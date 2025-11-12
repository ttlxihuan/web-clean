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
const sass = require('sass');
const CleanCSS = require('clean-css');
let filesystem = require('./filesystem');
let { makeOptions } = require('./options');
let templateTag = require('./htmlTemplate');
const { minify: jsMinify } = require('terser');
const { minify: htmlMinify } = require('html-minifier-terser');

/**
 * web清理
 */
function WebClean(webOptions = {}, templateName = null) {
    if (templateName) {
        webOptions = templateTag(templateName, webOptions);
    }
    webOptions = makeOptions(webOptions);
    let handle, loaders = [], paths = [];
    addLoader(webOptions.cssFileRule, parseLoader(webOptions.cssOptions, cssMinifier));
    addLoader(webOptions.jsFileRule, parseLoader(webOptions.jsOptions, jsMinifier));
    addLoader(webOptions.htmlFileRule, parseLoader(webOptions.htmlOptions, htmlMinifier));
    let skipFileRule = webOptions.skipFileRule ? makeFileRule(webOptions.skipFileRule) : null;
    // js 压缩处理器
    function jsMinifier(options) {
        return async function (code, targetFile = null) {
            if (targetFile && webOptions.makeSourceMap) {
                options.sourceMap = {
                    asObject: false,
                    filename: path.basename(targetFile) + '.map',
                };
            }
            let result = await jsMinify(code, options);
            if (targetFile) {
                filesystem.write(targetFile, result.code);
                if (webOptions.makeSourceMap) {
                    filesystem.write(targetFile + '.map', result.map);
                }
            }
        };
    }
    // css 压缩处理器
    function cssMinifier(options) {
        return async function (code, targetFile = null) {
            let result = new CleanCSS(options).minify(sass.compileString(code).css);
            if (targetFile) {
                if (webOptions.makeSourceMap) {
                    result.styles += "\n/*# sourceMappingURL=" + path.basename(targetFile) + ".map */";
                    filesystem.write(targetFile + '.map', String(result.sourceMap));
                }
                filesystem.write(targetFile, result.styles);
            }
        };
    }
    // html 压缩处理器
    function htmlMinifier(options) {
        return async function (code, targetFile = null) {
            let result = await htmlMinify(code, options);
            if (targetFile) {
                filesystem.write(targetFile, result);
            }
        };
    }
    // 生成文件匹配正则
    function makeFileRule(fileRule) {
        if (fileRule instanceof RegExp) {
            return fileRule;
        }
        return new RegExp('\\.(' + fileRule.replace(/[^\w\|]/, '\\$0') + ')$', 'i');
    }

    function parseLoader(options, minifier) {
        let loader;
        if (typeof (options) === 'function') {
            loader = options(this, minifier);
        } else if (typeof (options) === 'object') {
            loader = minifier(options);
        }
        if (typeof loader !== 'function') {
            loader = function () { };
        }
        return loader;
    }

    async function eachPaths(callback) {
        for (var next, file, iterator, key = 0; key < paths.length; key++) {
            let { sourcePath, targetPath } = paths[key];
            iterator = filesystem.scan(sourcePath);
            while (!(next = iterator.next(), file = next.value, next.done)) {
                await callback(file, targetPath + file.substring(sourcePath.length));
            }
        }
    }
    // 获取css和html的标识处理器
    function getCssAndHTMLIdentifiers() {
        let { convertIdentifier, agileIdentifiers } = require('./identifier');
        let { mangleCssIdentifiers, mangleHtmlIdentifiers } = require('./mangle');
        let _cssOptions = {};
        let _cssIdentifiers = {};
        ['id', 'class', 'var-def', 'var-use', 'tag', 'font-def', 'font-use', 'keyframes-def', 'keyframes-use'].forEach(function (key) {
            _cssOptions[key] = {};
            _cssIdentifiers[key] = convertIdentifier(_cssOptions[key]);
        })
        let _htmlOptions = {};
        let _htmlIdentifiers = {};
        ['id', 'class', 'tag'].forEach(function (key) {
            _htmlOptions[key] = {};
            _htmlIdentifiers[key] = convertIdentifier(_htmlOptions[key]);
        })
        function isRemoveIdentifiers() { return false; }
        let cssIdentifiers = agileIdentifiers(_cssIdentifiers, isRemoveIdentifiers);
        let htmlIdentifiers = agileIdentifiers(_htmlIdentifiers, isRemoveIdentifiers);
        let _cssMinifier = parseLoader({
            level: {
                1: { all: false },
                2: { all: false, removeEmpty: true }
            },
            plugins: [{
                level2: {
                    block: mangleCssIdentifiers(cssIdentifiers, webOptions.ignoreCssSelectorError)
                }
            }]
        }, cssMinifier);
        let _htmlMinifier = parseLoader({
            customAttrSurround: webOptions.htmlOptions.customAttrSurround || [],
            ignoreCustomFragments: webOptions.htmlOptions.ignoreCustomFragments || [],
            sortAttributes: mangleHtmlIdentifiers(htmlIdentifiers, function () { return false; })
        }, htmlMinifier);
        return [_cssMinifier, _htmlMinifier, _cssOptions, _htmlOptions];
    }
    // 提取跳过混淆或删除的样式标识
    async function skipControlCss() {
        let [_cssMinifier, _htmlMinifier, cssOptions, htmlOptions] = getCssAndHTMLIdentifiers();
        let cssFileRule = makeFileRule(webOptions.cssFileRule);
        let jsFileRule = makeFileRule(webOptions.jsFileRule);
        let htmlFileRule = makeFileRule(webOptions.htmlFileRule);
        let cssFiles = {}
        let jsFiles = {}
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
        await eachPaths(async function (sourceFile) {
            if (skipFileRule && skipFileRule.test(sourceFile)) {
                if (htmlFileRule.test(sourceFile)) {
                    await _htmlMinifier(filesystem.read(sourceFile));
                }
                if (cssFileRule.test(sourceFile)) {
                    await _cssMinifier(filesystem.read(sourceFile));
                }
            } else if (cssFileRule.test(sourceFile)) {
                cssFiles[getFileName(sourceFile)] = sourceFile;
            } else if (jsFileRule.test(sourceFile)) {
                jsFiles[getFileName(sourceFile)] = sourceFile;
            }
        });
        for (var name in cssFiles) {
            if (jsFiles[name] === undefined) {
                continue;
            }
            await _cssMinifier(filesystem.read(cssFiles[name]));
        }
        if (webOptions.cleanUnused) {
            toConfig(htmlOptions['id'], webOptions.removeUnusedIds, false);
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
    // 获取未使用的样式标识
    async function getUnused() {
        let [_cssMinifier, _htmlMinifier, cssOptions, htmlOptions] = getCssAndHTMLIdentifiers();
        let htmlFileRule = makeFileRule(webOptions.htmlFileRule);
        let cssFileRule = makeFileRule(webOptions.cssFileRule);
        await eachPaths(async function (sourceFile) {
            if (htmlFileRule.test(sourceFile)) {
                await _htmlMinifier(filesystem.read(sourceFile));
            } else if (cssFileRule.test(sourceFile)) {
                await _cssMinifier(filesystem.read(sourceFile));
            } else {
                return;
            }
        });
        function get_diff(source, target, mapping) {
            for (var key in source) {
                if (target[key] === undefined && mapping[key] === undefined) {
                    mapping[key] = true;
                }
            }
        }
        // 计算交集
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
    // 执行压缩处理
    async function run() {
        if (webOptions.skipControlCss || skipFileRule) {
            console.info('[Collect] skip -------------------------------------------------//');
            await skipControlCss();
        }
        // 删除未使用的class、id、var
        if (webOptions.cleanUnused) {
            console.info('[Collect] unused -------------------------------------------------//');
            await getUnused();
        }
        console.info('[minify] -------------------------------------------------//');
        await eachPaths(async function (sourceFile, targetFile) {
            if (skipFileRule && skipFileRule.test(sourceFile)) {
                return;
            }
            for (var key = 0; key < loaders.length; key++) {
                if (loaders[key].reg.test(sourceFile)) {
                    console.info('[minify] ' + sourceFile + ' => ' + targetFile);
                    await loaders[key].loader(filesystem.read(sourceFile), targetFile);
                    break;
                }
            }
            if (key >= loaders.length) {
                console.info('[copy] ' + sourceFile + ' => ' + targetFile);
                filesystem.copy(sourceFile, targetFile);
            }
        });
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
        let sourcePath = filesystem.realpath(sourceDir);
        let targetPath = filesystem.realpath(targetDir);
        paths.push({
            sourcePath,
            targetPath
        });
        return handle;
    }
    handle = { run, addPath, addLoader }

    return handle;
}

module.exports = WebClean;
