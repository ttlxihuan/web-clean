// 配置说明，版本 clean-css 1.0.0

const WebMinifier = require('web-minifier');

module.exports.options = {
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
    cleanUnused: false, // false|true 移除没有使用的class、id、var、attr等样式或属性，启用后会对css和html进行两次处理
    removeUnusedIds: {}, // false|{} 不保留要清除的 id，会删除css和html中相同的id块，指定键值对，当值为 true 时表示要删除该id 否则不删除，受 cleanUnused 开关影响
    removeUnusedClasses: {}, // false|{} 不保留要清除的 class，会删除css和html中相同的class块，当值为 true 时表示要删除该class 否则不删除，受 cleanUnused 开关影响
    removeUnusedCssVars: {}, // false|{} 不保留要清除的 css变量，会删除css中相同的变量块（声明或使用），当值为 true 时表示要删除该class 否则不删除，受 cleanUnused 开关影响
    removeUnusedCssTags: {}, // false|{} 不保留要清除的 css标签选择器，会删除css中标签选择器，当值为 true 时表示要删除该标签选择器 否则不删除，受 cleanUnused 开关影响
    removeUnusedCssKeyframes: {}, // false|{} 不保留要清除的 css动画，当值为 true 时表示要删除动画名 否则不删除，受 cleanUnused 开关影响
    removeUnusedCssFonts: {}, // false|{} 不保留要清除的 css字体，当值为 true 时表示要删除字体名 否则不删除，受 cleanUnused 开关影响
    removeUnusedHtmlAttrs: [], // RegExp|Array|Function 要删除的html属性名
    makeSourceMap: false, // 是否生成map文件
    skipFileRule: false, // RegExp|string|false  跳过处理文件
    ignoreCssSelectorError: true, // 忽略css选择器错误语句
};


module.exports.run = async function (options, paths) {
    let webMinifier = new WebMinifier(options);
    paths.forEach(item => {
        webMinifier.addPath(item[0], item[1]); // 添加要压缩处理的 源目录 => 目标目录
    });
    webMinifier.run();
}
