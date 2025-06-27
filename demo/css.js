// 配置说明，版本 clean-css 5.3.3

const CleanCSS = require('clean-css');

module.exports.options = {
    batch: false, // 批量分开处理还是合并处理
    // 兼容性处理
    // 可选参数：
    //      {}      自定义兼容配置
    //      '*'     使用默认兼容配置
    //      'ie7'   兼容到ie7
    //      'ie8'   兼容到ie8
    //      'ie9'   兼容到ie9
    //      'ie10'  兼容到ie10
    //      'ie11'  兼容到ie11
    compatibility: { // 兼容性处理，可以指定对象或内置的兼容级别
        colors: { // 颜色兼容
            hexAlpha: false, // 是否支持4或8位的十六进制颜色（最后一位是透明度）
            opacity: true // 支持`rgba()` 和 `hsla()` 颜色，ie9起
        },
        properties: { // 样式兼容
            backgroundClipMerging: true, // 将background-clip合并为简写，ie9起
            backgroundOriginMerging: true, // 将background-origin合并为简写，ie9起
            backgroundSizeMerging: true, // 将background-size合并为简写，ie9起
            colors: true, // 颜色值简写
            ieBangHack: false, // 是否保留ie7的hack样式（专用识别样式）
            ieFilters: false, // 是否保留ie浏览器专用的 `filter` 和 `-ms-filter` 样式
            iePrefixHack: false, // 是否保留ie8及以前以 _ 和 * 开头的 hack 样式
            ieSuffixHack: false, // 是否保留ie6~9以 \9 结尾和ie6~11以 \0 结尾的hack样式
            merging: true, // 是否开启属性合并（受level影响）
            shorterLengthUnits: false, // 是否尝试将像素单位改为（受允许使用单位影响） `pc`、`pt`、`in`
            spaceAfterClosingBrace: true, // 是否将带括号后面连接的属性值之前空格去掉，比如：`url() no-repeat` 改为 `url()no-repeat`
            urlQuotes: true, // 是否给属性值 url() 内的地址使用引号
            zeroUnits: true // 去掉0对应的单位名
        },
        selectors: { // 选择器兼容
            adjacentSpace: false, // 是否将 selector+nav 改为 selector+ nav  （Android浏览器的hack选择器，目前作用不大）
            ie7Hack: true, // 是否保留ie7的hack选择器，比如： *+html
            mergeablePseudoClasses: [':active',], // 指定可以合并的伪类选择器列表（默认内置所有）
            mergeablePseudoElements: ['::after',], // 指定可以合并的伪元素选择器列表（默认内置所有）
            mergeLimit: 8191, // 合并单个选择器最大相邻个数范围，从4.1.0版本起生效
            multiplePseudoMerging: true // 允许多个伪类和元素合并，从4.1.0版本起生效
        },
        units: { // 允许使用单位
            ch: true, // ie9起
            in: true,
            pc: true,
            pt: true,
            rem: true, // ie9起
            vh: true, // ie9起
            vm: true, // ie9起
            vmax: true, // ie9起
            vmin: true, // ie9起
            vw: true // ie9起
        }
    },
    explicitRebaseTo: 'rebaseTo' in options, // 内部选项，配置 rebaseTo 选项时有效
    // 获取外部资源处理函数，当样式中出现类似 @import url(http://example.com/path/to/stylesheet.css); 时会自动去下载指定的样式文件进行压缩处理
    // 内置提示了常规远程获取函数，当需要定制化处理时可自定义
    // 参数说明：
    //      uri             要下载的远程资源地址
    //      inlineRequest   请求选项
    //      inlineTimeout   请求超时回调
    //      callback        请求成功回调（将资源数据传给解析器处理）
    fetch: fetchFrom(uri, inlineRequest, inlineTimeout, callback),
    format: { // 输出格式配置
        breaks: { // 样式块换行配置
            afterAtRule: 2,  // 给 @import、@charset 等规则后增加换行数
            afterBlockBegins: 1, // 给 @font-face、@media 等规则 { 后增加换行数
            afterBlockEnds: 2, // 给 @font-face、@media 等规则 } 后增加换行数
            afterComment: 1, // 给注释增加换行数
            afterProperty: 1, // 给属性增加换行数
            afterRuleBegins: 1, // 给选择器规则开始 { 前增加换行数
            afterRuleEnds: 1, // 给选择器规则开始 } 后增加换行数
            beforeBlockEnds: 1, // 给选择器规则开始 { 后增加换行数
            betweenSelectors: 0 // 多个选择器之间增加换行数
        },
        breakWith: '\n', // 指定换行符
        indentBy: 0, // 指定缩进空格数（当需要格式化输出时可配置）
        indentWith: ' ', // 指定空格符
        spaces: { // 配置在哪里插入空格，用于完成格式化输出
            aroundSelectorRelation: false, // 选择器关系周围是否插入空格，比如: div>a 改为 div > a
            beforeBlockBegins: false, // 在大括号前是否插入空格
            beforeValue: false // 在样式属性值前面是否插入空格
        },
        wrapAt: false, // 是否限制一行最大长度，超出就换行，要限制长度时必需指定一个 > 0 的数值
        semicolonAfterLastProperty: false // 是否保留每个样式块中最后一个属性值后面的分号，比如： *{display:none;} 改为 *{display:none}
    },
    // 指定要处理的规则范围，主要针对：@import
    // 可选值：
    //      false       与 ['none'] 一个意思
    //      string      多个处理范围使用逗号分开
    //      undefined   与 ['local'] 一个意思（默认）
    //      array       指定处理范围，内置有： none 禁用所有范围， local 开放本地范围，all 开放所有范围，remote 开放所有远程范围，host 开放指定域名范围，!host 不开放指定域名范围
    inline: inlineFrom(options.inline),
    // 指定下载 @import 远程文件时额外请求选项，可以是任务 http(s) 请求选项：https://nodejs.org/api/http.html#http_http_request_options_callback
    inlineRequest: inlineRequestFrom(options.inlineRequest),
    // 指定下载 @import 远程文件超时时长（毫秒），默认： 5000
    inlineTimeout: inlineTimeoutFrom(options.inlineTimeout),
    // 指定优化等级，0~2，默认是1
    //      0   该等级没有优化处理，一般在只想拉取 @import 远程代码时有意义
    //      1   该等级只针对单个属性，比如：把0px改为0，色值从6位改到3位，删除注释等
    //      2   该等级可优化规则和多属性，比如：删除重复的规则和属性，合并属性
    // 可选值：
    //      undefined       使用 0~1 优化等级（默认）
    //      number|string   使用指定优化等级（会转为整数，可选范围 0~2）
    //      object          使用指定的优化等级并指定优化等级的配置选项
    level: {
        1: { // 1级优化主要针对单个属性或选择器，比如：色值压缩、小数处理、选择器简化等
            all: false,  // 开关当前优化等级的所有选项，可以后面再单独开放少量选项。（用于只使用少量选项场景）
            cleanupCharsets: true, // 是否将@charset移动到样式表最前面并移除其它多余的@charset
            normalizeUrls: true, // 是否将样式值中的 url() 部分中的 url 改为全小写（规范化）
            optimizeBackground: true, // 是否简化 background 值，目前可简化有：background:none; 和 background:transparent; 改为 background:0 0;
            optimizeBorderRadius: true, // 是否简化 border-radius 值，目前可简化有：border-radius 中指定3、5、7、9个值的处理
            optimizeFilter: true, // 是否简化 filter 值
            optimizeFont: true, // ---- 未见使用选项
            optimizeFontWeight: true, // 是否简化 font-weight 值，目前可简化有： font-weight:normal 改为 font-weight:400 ，font-weight:bold 改为 font-weight:700 
            optimizeOutline: true, // 是否简化 outline 值，目前可简化有： outline:none 改为 outline:0
            removeEmpty: true, // 是否删除空样式块，即未写样式的 selector {} 代码
            removeNegativePaddings: true, // 是否删除 padding 存在负值的样式。将 padding:0 0 0 0; 改为 padding:0; 没有开关配置
            removeQuotes: true, // 是否尝试删除值中引号，目前只针对：font、font-family、animation、animation-name
            removeWhitespace: true, // 删除样式值内无效空白符号，不包括简写多值空格，针对独立值，比如 var、calc
            replaceMultipleZeros: true, // 是否删除多余的0，目前只针对 margin，比如：margin:0 0 0 0;改为 margin：0;
            replaceTimeUnits: true, // 是否简化时长值，通过转换单位获取最短时长值，单位（s、ms）
            replaceZeroUnits: true, // 是否替换掉小数中多余的0
            // 指定不同单位小数四舍五入保留小数位数
            // 可选值：
            //      false       不需要舍去有效小数
            //      object      指定不同单独的小数保留位数，比如: {px: 6,rem: 4, vw: 'off'}  这里只指定px、rem需要处理小数，vw不需要处理小数
            roundingPrecision: false,
            // 多个选择器之间排序处理
            // 可选值：
            //      'standard'          标准排序（简单比较），正序排      
            //      'natural'           提取选择器中的数值进行排序
            //      'none'|false        不排序
            selectorsSortingMethod: 'standard',
            // 保留 /*! ... */ 注释数量，注意：注释必需是以 /*! 开头才处理保留
            // 可选值：
            //      'all'           保留所有匹配注释
            //      number          只保留指定数量的匹配注释
            //      false           不保留注释
            specialComments: 'all',
            tidyAtRules: true, // 去掉 @charset 和 @import 多余的空格（@import会被处理）
            tidyBlockScopes: true, // 去掉 @media 多余的空格，去掉@keyframes多余的引号和空格
            // 选择器格式优化，
            //  比如：
            //      1、尝试去掉属性选择器的引号
            //      2、伪类选择器简化（比如：nth-child(1) 改为 first-child）
            //      3、多级选择器中间多余空格剔除
            //      4、无效选择器判断
            //      5、html注释剥离
            tidySelectors: true,
            // css变量值优化处理，默认没有任何处理，可以使用内置的优化处理器
            // 文档： https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties
            // 可选值：
            //      string          内置优化处理器
            //              color           颜色值优化
            //              degrees         度数优化，比如：0deg 改为 (0)
            //              fraction        小数优化，比如： 0.0px 改为 0px
            //              precision       小数精度优化，四舍五入保留指定位数小数
            //              textQuotes      文本去掉引号
            //              time            时间单位转换简化
            //              unit            单位简化
            //              urlPrefix       URL值 url() 部分全小写（不含地址）
            //              urlQuotes       URL值中地址去掉引号
            //              urlWhiteSpace   URL值去掉多余空格
            //              whiteSpace      去掉值中多余空格
            //              zero            零值简化
            //      Function(name, value, options)
            //                      自定义值处理器
            //              name        样式属性名（变量名），比如：--c-color、--b-background 等
            //              value       样式属性值，比如：#00ff00、red 等
            //              options     优化器整体配置表（即 new CleanCSS(options) 中的默认值处理完后的 options）
            variableValueOptimizers: [],
            variableOptimizers: [] // 内部隐藏配置项，是 variableValueOptimizers 处理后的处理器，可以直接指定避免内部处理（指定后 variableValueOptimizers 无效）
        },
        2: { // 2级优化主要针对多样式或选择器处理，比如：合并多个样式，删除相同样式等
            all: false,  // 开关当前优化等级的所有选项，可以后面再单独开放少量选项。（用于只使用少量选项场景）
            // 是否合并相邻样式，可合并的两组规则必需是同一层级（比如：相同的 @media 内(需要mergeMedia合并)，或不在 @media 内）而且内部样式集合和顺序必需全部一样
            // 合并以选择器匹配 + 样式集匹配，当选择器匹配时才会逐个查下后面匹配选择器且样式集也一样，当样式集不一样时则放弃该选择器合并
            mergeAdjacentRules: true,
            mergeIntoShorthands: true, // 是否将多个同源属性合并到简写中，比如：margin-left、margin-top、margin-right、margin-bottom 合并为 margin
            mergeMedia: true, // 是否合并 @media 相同块，如果合并块之间存在相同的选择器会干扰合并处理
            // 是否合并相邻规则
            // 可选值：
            //      false           不合并相邻规则
            //      true            合并相邻规则，相同的规则集合并&相同选择器合并
            //      'body'          相同的规则集合并
            //      'selector'      相同选择器合并
            mergeNonAdjacentRules: true,
            // 合并 @media 和 'body' 时会先判断选择器的语义，不合并 -- 开头的选择器
            mergeSemantically: false, // ----------- ??
            overrideProperties: true, // 重写属性且相同的属性只使用最后一个，比如：把 border-width 重写到 border 中
            removeEmpty: true, // 删除空和规则块，比如：删除没有写样式属性的 body{}、@media screen and (max-width: 300px){} 
            reduceNonAdjacentRules: true, // 合并所有选择器相同的规则块
            removeDuplicateFontRules: true, // 是否删除重复的 `@font-face` 字体规则
            removeDuplicateMediaBlocks: true, // 是否删除重复的 `@media` 规则块
            removeDuplicateRules: true, // 是否删除重复的规则块
            removeUnusedAtRules: false, // 是否删除未使用 @ 规则块，比如: @keyframes、@font-face 等
            restructureRules: false, // 是否使用规则重组，----------- ??
            // 跳过优化指定属性集，4.1.0 版本开始有效
            // 可选值：
            //      string      多个属性名以逗号分隔
            //      array       多个属性名数组集合
            skipProperties: []
        }
    },
    // 版本 5 及更高版本中，您可以定义与 1 级和 2 级优化一起运行的插件
    // 示例： [ {level1: {value: Function(name, value, options), property: Function(serializedRule, property, options)}, level2:{ block: Function(tokens)}}  ]
    // 可选值：
    //      level1          配置优化1额外处理
    //              value       优化属性值回调处理，回调参数：
    //                              name            属性名
    //                              value           属性值
    //                              options         整个配置体（所有配置初始化后）
    //              property    优化属性名回调处理，回调参数：
    //                              serializedRule  当前样式段选择器串
    //                              property        当前属性数据体（包括属性名&值）
    //                              options         整个配置体（所有配置初始化后）
    //      level2          配置优化2额外处理
    //              block       优化整个样式块，回调参数：
    //                              tokens          整体样式体结构（解析及优化后的所有结构）
    plugins: pluginsFrom(options.plugins),
    // 是否要重置基目录，开启后会修改所有本地URL相对基地址
    // 可选值：
    //      true            重置基目录
    //      undefined       不重置基目录（默认）
    //      false           不重置基目录
    rebase: rebaseFrom(options.rebase, options.rebaseTo),
    // 指定重置后的新基目录，
    // 可选值：
    //      string          指定的目录，为空时会使用 process.cwd()
    //      undefined       当使用 rebase 时，则会按空处理，并报警
    rebaseTo: rebaseToFrom(options.rebaseTo),
    returnPromise: false, // 是否返回 Promise ，即是否返回异步处理器
    sourceMap: !!options.sourceMap, // 是否构建输出源映射
    // 
    sourceMapInlineSources: !!options.sourceMapInlineSources // 源映射的字段中嵌入源（外加）
};

module.exports.run = async function (code, options) {
    // 参数说明：
    //      code                css代码
    //      maybeSourceMap      初始映射源，不指定则新建，指定则累加
    //      maybeCallback       Function(error, output) 远程资源提取回调处理器，不指定则会删除 @import 远程导入，注意：一但传入此参数则 minify 变成异步且无返回值，数据需要从该函数的 output 中提取
    new CleanCSS(options).minify(code, maybeSourceMap, maybeCallback);
}