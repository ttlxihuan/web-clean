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
let filesystem = require('./filesystem');
let makeOptions = require('./options');
const { minify: jsMinify } = require('terser');
const { minify: htmlMinify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const sass = require('sass');

/**
 * web清理
 */
function WebClean(webOptions = {}) {
    webOptions = makeOptions(webOptions);
    let handle, loaders = [], paths = [];

    addLoader(webOptions.cssFileRule, parseLoader(webOptions.cssOptions, cssMinifier));
    addLoader(webOptions.jsFileRule, parseLoader(webOptions.jsOptions, jsMinifier));
    addLoader(webOptions.htmlFileRule, parseLoader(webOptions.htmlOptions, htmlMinifier));
    let skipFileRule = webOptions.skipFileRule ? makeFileRule(webOptions.skipFileRule) : null;

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

    function htmlMinifier(options) {
        return async function (code, targetFile = null) {
            let result = await htmlMinify(code, options);
            if (targetFile) {
                filesystem.write(targetFile, result);
            }
        };
    }

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

    async function getUnused() {
        let { convertIdentifier, keepIdentifier, agileIdentifiers } = require('./identifier');
        let { mangleCssIdentifiers, mangleHtmlIdentifiers } = require('./mangle');
        let cssId = {}, cssClass = {}, cssVarDef = {}, cssVarUse = {}, cssTag = {}, cssFontDef = {}, cssFontUse = {}, cssKeyframesDef = {}, cssKeyframesUse = {};
        let htmlId = {}, htmlClass = {}, htmlTag = {};

        function isRemoveIdentifiers() { return false; }

        let cssIdentifiers = agileIdentifiers({
            'id': convertIdentifier(cssId),
            'class': convertIdentifier(cssClass),
            'var-def': convertIdentifier(cssVarDef),
            'var-use': convertIdentifier(cssVarUse),
            'tag': keepIdentifier(cssTag),
            'font-def': convertIdentifier(cssFontDef),
            'font-use': convertIdentifier(cssFontUse),
            'keyframes-def': convertIdentifier(cssKeyframesDef),
            'keyframes-use': convertIdentifier(cssKeyframesUse),
        }, isRemoveIdentifiers);
        let htmlIdentifiers = agileIdentifiers({
            'id': convertIdentifier(htmlId),
            'class': convertIdentifier(htmlClass),
            'tag': keepIdentifier(htmlTag)
        }, isRemoveIdentifiers);

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


        let htmlFileRule = makeFileRule(webOptions.htmlFileRule);
        let cssFileRule = makeFileRule(webOptions.cssFileRule);
        // 提取所有的id & class
        console.info('[collect] -------------------------------------------------//');
        await eachPaths(async function (sourceFile) {
            console.info('[collect] ' + sourceFile);
            if (htmlFileRule.test(sourceFile)) {
                await _htmlMinifier(filesystem.read(sourceFile));
            } else if (cssFileRule.test(sourceFile)) {
                await _cssMinifier(filesystem.read(sourceFile));
            } else {
                return;
            }
        });
        function get_diff(source, target, mapping = {}) {
            for (var key in source) {
                if (target[key] === undefined && mapping[key] === undefined) {
                    mapping[key] = true;
                }
            }
        }
        // 计算交集
        get_diff(cssId, htmlId, webOptions.removeUnusedIds);
        get_diff(htmlId, cssId, webOptions.removeUnusedIds);
        get_diff(cssClass, htmlClass, webOptions.removeUnusedClasses);
        get_diff(htmlClass, cssClass, webOptions.removeUnusedClasses);
        get_diff(cssVarDef, cssVarUse, webOptions.removeUnusedCssVars);
        get_diff(cssVarUse, cssVarDef, webOptions.removeUnusedCssVars);
        get_diff(cssTag, htmlTag, webOptions.removeUnusedCssTags);
        // 处理字体，动画等内容
        get_diff(cssFontDef, cssFontUse, webOptions.removeUnusedCssFonts);
        get_diff(cssFontUse, cssFontDef, webOptions.removeUnusedCssFonts);
        get_diff(cssKeyframesDef, cssKeyframesUse, webOptions.removeUnusedCssKeyframes);
        get_diff(cssKeyframesUse, cssKeyframesDef, webOptions.removeUnusedCssKeyframes);
    }

    async function run() {
        // 删除未使用的class、id、var
        if (webOptions.cleanUnused) {
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
