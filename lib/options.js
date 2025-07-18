/**
 * 选项处理
 */

let { configConvertIdentifier, keepIdentifier, agileIdentifiers } = require('./identifier');
let { mangleCssIdentifiers, mangleHtmlIdentifiers } = require('./mangle');

function getDefaultOptions() {
    return {
        cssOptions: {
            batch: true, // 批量处理
            compatibility: '*', // 兼容等级通用
            level: 2, // 压缩等级默认最大化
            inline: ['all'] // 允许所有来源地址
        },
        cssFileRule: 'css', // RegExp|string  css 文件后缀名
        jsOptions: {
            output: {
                comments: false, // 不要注释
                indent_level: 0, // 不要缩进
                indent_start: 0 // 不要起始缩进
            },
            parse: {
                bare_returns: true // 支持最顶层使用return
            }
        },
        jsFileRule: 'js', // RegExp|string  js 文件后缀名
        htmlOptions: {
            customAttrSurround: [],
            collapseBooleanAttributes: true, // 去掉bool值属性的值
            removeComments: true, // 删除所有注释
            collapseWhitespace: true, // 删除所有空格和换行，非 pre|textarea 标签
        },
        htmlFileRule: 'html|htm', // RegExp|string  html 文件后缀名
        mangleClassIdentifiers: {}, // false|{}  指定混淆缩小class，指定 {} 时为对照表（可用于指定不处理对照表），在属性选择器中使用不会替换
        mangleIdIdentifiers: {},// false|{} 指定混淆缩小id，指定 {} 时为对照表（可用于指定不处理对照表），在属性选择器中使用不会替换
        mangleCssVarIdentifiers: {}, // false|{} css 变量名缩小，指定 {} 时为对照表（可用于指定不处理对照表），在属性选择器中使用不会替换
        mangleCssKeyframesIdentifiers: {}, // false|{} css 动画名缩小，指定 {} 时为对照表（可用于指定不处理对照表），在属性选择器中使用不会替换
        mangleCssFontIdentifiers: {}, // false|{} css 字体名缩小，指定 {} 时为对照表（可用于指定不处理对照表），在属性选择器中使用不会替换
        cleanUnused: true, // false|true 移除没有使用的class、id、var、attr等样式或属性，启用后会对css和html进行两次处理
        removeUnusedIds: {}, // false|{} 不保留要清除的 id，会删除css和html中相同的id块，指定键值对，当值为 true 时表示要删除该id 否则不删除，受 cleanUnused 开关影响
        removeUnusedClasses: {}, // false|{} 不保留要清除的 class，会删除css和html中相同的class块，当值为 true 时表示要删除该class 否则不删除，受 cleanUnused 开关影响
        removeUnusedCssVars: {}, // false|{} 不保留要清除的 css变量，会删除css中相同的变量块（声明或使用），当值为 true 时表示要删除该class 否则不删除，受 cleanUnused 开关影响
        removeUnusedCssTags: {}, // false|{} 不保留要清除的 css标签选择器，会删除css中标签选择器，当值为 true 时表示要删除该标签选择器 否则不删除，受 cleanUnused 开关影响
        removeUnusedCssKeyframes: {}, // false|{} 不保留要清除的 css动画，当值为 true 时表示要删除动画名 否则不删除，受 cleanUnused 开关影响
        removeUnusedCssFonts: {}, // false|{} 不保留要清除的 css字体，当值为 true 时表示要删除字体名 否则不删除，受 cleanUnused 开关影响
        removeHtmlAttrs: [], // RegExp|Array|Function(tag, attrName, attrValue) 要删除的html属性名
        makeSourceMap: false, // 是否生成map文件
        skipFileRule: false, // RegExp|string|false  跳过处理文件
        ignoreCssSelectorError: true, // 忽略css选择器错误语句
    };
}


function mergeOptions(source, target) {
    for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            var value = source[key];
            if (Object.prototype.hasOwnProperty.call(target, key) && typeof value === 'object' && typeof target[key] === 'object' && !Array.isArray(value)) {
                target[key] = mergeOptions(value, target[key] || {});
            } else {
                target[key] = key in target ? target[key] : value;
            }
        }
    }
    return target;
}

function makeOptions(options = {}) {
    options = mergeOptions(getDefaultOptions(), options);
    // 启用混淆压缩html或css的class与id名
    // 是否删除标识
    function isRemoveIdentifiers(type, name) {
        switch (type) {
            case 'id':
                return options.removeUnusedIds[name] === true;
            case 'class':
                return options.removeUnusedClasses[name] === true;
            case 'var-def':
            case 'var-use':
                return options.removeUnusedCssVars[name] === true;
            case 'tag':
                return options.removeUnusedCssTags[name] === true;
            case 'font-def':
            case 'font-use':
                return options.removeUnusedCssFonts[name] === true;
            case 'keyframes-def':
            case 'keyframes-use':
                return options.removeUnusedCssKeyframes[name] === true;
            default:
                return false;
        }
    }
    let mangleCssVarIdentifiers = options.mangleCssVarIdentifiers ? configConvertIdentifier(options, 'mangleCssVarIdentifiers') : keepIdentifier();
    let mangleCssFontIdentifiers = options.mangleCssFontIdentifiers ? configConvertIdentifier(options, 'mangleCssFontIdentifiers') : keepIdentifier();
    let mangleCssKeyframesIdentifiers = options.mangleCssKeyframesIdentifiers ? configConvertIdentifier(options, 'mangleCssKeyframesIdentifiers') : keepIdentifier();
    let identifiers = agileIdentifiers({
        'id': options.mangleIdIdentifiers ? configConvertIdentifier(options, 'mangleIdIdentifiers') : keepIdentifier(),
        'class': options.mangleClassIdentifiers ? configConvertIdentifier(options, 'mangleClassIdentifiers') : keepIdentifier(),
        'var-def': mangleCssVarIdentifiers,
        'var-use': mangleCssVarIdentifiers,
        'tag': keepIdentifier(),
        'font-def': mangleCssFontIdentifiers,
        'font-use': mangleCssFontIdentifiers,
        'keyframes-def': mangleCssKeyframesIdentifiers,
        'keyframes-use': mangleCssKeyframesIdentifiers,
    }, options.cleanUnused ? isRemoveIdentifiers : function () { return false; });

    // css选项处理
    if (options.cssOptions) {
        options.cssOptions.plugins = options.cssOptions.plugins || [];
        let cssMangleOption = {
            level2: {
                block: mangleCssIdentifiers(identifiers, options.ignoreCssSelectorError)
            }
        }
        options.cssOptions.plugins.push(cssMangleOption);
    }
    function returnFalse() {
        return false;
    }
    // html选项处理
    let removeAttr;
    if (typeof (options.removeHtmlAttrs) === 'function') {
        removeAttr = options.removeHtmlAttrs;
    } else if (options.removeHtmlAttrs instanceof RegExp) {
        removeAttr = function (tag, name) {
            return options.removeHtmlAttrs.test(name);
        };
    } else if (options.removeHtmlAttrs instanceof Array) {
        removeAttr = function (tag, name, value) {
            function escape(str) {
                return str.replace(/([\^\$\\.*+?(){}\[\]|])/g, '\\$1');
            }
            var nameReg = new RegExp('^' + escape(name) + '$', 'i');
            var tagReg = new RegExp('^' + escape(tag) + '$', 'i');
            for (var key = 0, attr; key < options.removeHtmlAttrs.length; key++) {
                attr = String(options.removeHtmlAttrs[key]);
                if (nameReg.test(attr)) {
                    return true;
                }
                var match = attr.match(/^(([^>]*)>)?([^=]*)?(=(.*))?$/)
                if (match) {
                    if (match[2] === undefined || tagReg.test(match[2])) {
                        if (match[3] === undefined || nameReg.test(match[3])) {
                            if (match[5] === undefined || value === match[5]) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };
    } else {
        removeAttr = returnFalse;
    }
    options.htmlOptions.sortAttributes = mangleHtmlIdentifiers(identifiers, removeAttr, options.htmlOptions.sortAttributes || null);
    if (options.makeSourceMap) {
        options = mergeOptions({
            cssOptions: {
                sourceMap: true,
                sourceMapInlineSources: true
            }
        }, options);
    }
    options = mergeOptions({
        htmlOptions: {
            minifyCSS: options.cssOptions,
            minifyJS: options.jsOptions,
        }
    }, options);
    return options;
}


module.exports = { makeOptions, mergeOptions };