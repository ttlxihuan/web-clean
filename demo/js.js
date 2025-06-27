// 配置说明，版本 terser 5.39.0

const { minify } = require('terser');

module.exports.options = {
    compress: { // 压缩选项（用于优化代码结构）
        arguments: false, // 是否将函数内 arguments[index] 替换为指定参数名（当无法确定 index 值时不会替换）
        arrows: true, // 是否将ES6中对象或类内部的方法简化掉，使用 fun()=>{} 或 fun(){} 结构 ----------- ??
        booleans: true, // 优化布尔表达式，比如 !!a ? b : c  优化为 a ? b : c ----------- ??
        booleans_as_integers: false, // 将 !== 或 === 改为 != 和 == ，将布尔值改为 0 或 1 ----------- ??
        collapse_vars: true, // 在副作用允许的情况下，折叠一次性使用的非常量变量。 ----------- ??
        comparisons: true, // 布尔运算表达式简化
        computed_props: true, // 简化属性，在不影响语法情况下尝试去掉引号（如果属性不是有效命名跳过），比如 {"computed": 1} 改为 {computed: 1}
        conditionals: true, // if、for、while、其它运算表达式简化
        dead_code: true, // 删除无法访问的代码
        defaults: true, // 是否开启默认启用的选项（关闭后所有默认启用的选项将被关闭，需要另外单独开启）
        directives: true, // 删除多余的 "use asm" 或 "use strict" 命令
        drop_console: false, // 删除控制台操作，会删除所有 console 操作语句，即使在参数中有运算处理也一并删除了
        drop_debugger: true, // 删除 debugger 操作
        ecma: 5, // 压缩ES输出版本（针对部分法语转换），可传 5, 2015, 2016 , 2017
        evaluate: true, // 尝试计算出常量表达式的值
        expression: false, // 简化返回或结束语句表达式
        global_defs: false, // 在全局解析处理时会进行替换或删除，{DEBUG: false} 时会删除代码块 if(DEBUG){...} 但 if(DEBUG || 1){...} 会保留if块内部代码，替换任意表达式 { '@alert' : 'console.log'} 会将所有 alert 调用换成 console.log 
        hoist_funs: false, // 将函数声明语句提到当前区块前面
        hoist_props: true, // 将属性或数组分开赋值移到到初始（移动能力有限）
        hoist_vars: false, // 将变量声明移动到当前区块前面（该移动并不能减少代码量，相反可能会增加代码量）
        ie8: false, // 是否支持到IE8
        if_return: true, // 优化if/return和if/continue语句
        inline: true, // 使用简单/语句内联调用函数（当闭包内部代码明确对外部无影响则剥离闭包，提取闭包内部代码放到外部）。 0|false 关闭内联调用优化，1 使用简单内联调用函数，2 使用简单内联调用函数&参数，3|true 使用简单内联调用函数&参数&变量 ----------- ??
        join_vars: true, // 启用连续语句合并，主要针对 var、let、const
        keep_classnames: false, // 要保持原样的类名不被压缩器丢弃（class），false 全部不保留，true 全部保留，RegExp 正则匹配的保留
        keep_fargs: true, // 不删除函数未使用的参数
        keep_fnames: false, // 要保持原来的函数名不被压缩器丢弃（function），false 全部不保留，true 全部保留，RegExp 正则匹配的保留
        keep_infinity: false, // 要保持Infinity（无穷大）不被转换，比如：把 Infinity 转为 1/0
        lhs_constants: true, // 将比较运行表达式的常量移动到左边
        loops: true, // 当能确定静态量时简化压缩循环语句
        module: false, // 是否为压缩ES6模块
        negate_iife: true, // 将闭包取反，避免闭包前面的括号产生作用，比如： (function(){})(); 改为 !function(){}()
        passes: 1, // 压缩运行最大次数，次数大可能会进一步压缩代码但会花费更多时间
        properties: true, // 使用点访问属性，比如： foo["bar"] 改为 foo.bar
        pure_getters: "strict", // 指定是否优化掉无用属性 ----------- ??
        pure_funcs: null, // 指定一些无用的函数，用于删除
        pure_new: false, // 优化new运算
        reduce_funcs: true, // 尽可能内联一次性函数。禁用此选项有时可以提高输出代码的性能。
        reduce_vars: true,  // 改进对作为常数值分配和使用的变量的优化。
        sequences: true, // 使用逗号连接简单语句，可以指定为数值限制连接最大个数
        side_effects: true, // 删除无作用的表达式，并且表达式结果未被使用
        switches: true, // 删除switch重复数据并删除无法访问的分支
        top_retain: null, // 禁止删除顶层未使用的函数或变量，可以是数组（函数或变量名）、字符串（逗号分隔）、正则、函数
        toplevel: false, // 删除顶层未使用的函数或变量
        typeofs: true, // 转换typeof比较运行，比如 "undefined" == typeof x 改为 undefined === x
        unsafe: false, // 转换一此内置简单的语句，比如 new Array(1, 2, 3) 转换成 [ 1, 2, 3 ] ，此选项转换内容很多，大部分代码转换完后没有问题
        unsafe_arrows: false, // （ecma > 2015 有效）转换 ES5 风格的匿名函数 表达式设置为箭头函数，此转换要求 compress 选项设置为或更大
        unsafe_comps: false, // 左右转换 >、>=、<、<= 运算，当两个操作数中至少有一个是具有计算值的对象时，由于使用诸如、或等方法，这可能是不安全的
        unsafe_Function: false, // 将 new Function() 改为 function(){}
        unsafe_math: false, // 转换优化数字表达式，比如 2 * x * 3 改为 6 * x
        unsafe_symbols: false, // 从原生 Symbol 中删除键，比如 Symbol("kDog") 改为 Symbol()
        unsafe_methods: false, // （ecma > 2015 有效）转换属性方法，比如 {p:function(){}} 改为 {p(){}} ， true 转换所有类似语法，正则 转换匹配的方法名
        unsafe_proto: false, // 优化内置对象属性结构，比如 Array.prototype.slice.call(a) 改为 [].slice.call(a) ，可处理对象：Array，Function，Number，Object，RegExp，String
        unsafe_regexp: false, // 启用变量与值的替换，把变量的值替换到变量的位置上
        unsafe_undefined: false, // 转换 undefined，如果有变量指定为 undefined 则可以去掉直接使用 undefined
        unused: true, // 删除未引用的函数和变量，直接变量赋值不计为引用（可设置该选项为 "keep_assign" 将赋值计为引用）
        warnings: false  // 历史遗留，已遗弃
    },
    ecma: undefined, // 全局的ES输出版本（会覆盖 parse、compress、format），空值时不覆盖
    // 将要解析代码嵌入到闭包中处理再压缩优化（嵌入后原来顶层代码会全部按非顶层处理）
    // 可选参数：
    //      false 不嵌入到闭包中，
    //      true 嵌入到闭包中（最终解析代码： '(function(){$code})()'），
    //      string 嵌入到闭包中并提供闭包参数，冒号分开，逗号为参数列表分隔（例如： 'global,obj:window,{}'  最终解析代码：'(function(global,obj){$code})(window,{})'）
    enclose: false,
    // 按commonjs模式解析
    // 可选参数：
    //      {}                      原始exports体
    //      'undefined'             默认一个空的exports体
    //      false|null|undefined    不使用commonjs模式解析
    wrap: false, // 按commonjs模式解析 (function(exports){'$ORIG';})(typeof $wrap=='undefined'?($wrap={}):$wrap);
    ie8: false, // 全局是否支持到IE8（会覆盖 compress、mangle、format），空值时不覆盖
    keep_classnames: undefined, // （有效时覆盖）全局要保持原样的类名不压缩修改（会覆盖 compress、mangle），空值时不覆盖
    keep_fnames: false, // （有效时覆盖）全局要保持原来的函数名不压缩修改（会覆盖 compress、mangle），空值时不覆盖
    mangle: { // 混乱选项（用于混淆局部变量量，把变量名改为指定顺序，比如： function(param1,param2){} 改为 function(a,b){}）
        cache: options.nameCache && (options.nameCache.vars || {}), // 已经缓存的混淆对应名（对应名不会识别所属是否匹配）
        eval: false, // ----------- ??
        ie8: false, // 支持非标准Internet Explorer 8。
        keep_classnames: false, // 是否混淆类名（class），false 全部混淆，true 全部不混淆，RegExp 正则匹配的不混淆
        keep_fnames: false, // 是否混淆函数（function），false 全部混淆，true 全部不混淆，RegExp 正则匹配的不混淆
        module: false,
        nth_identifier: base54, // 混淆时生成的新命令处理器，有内置的，可以命令为特殊符号的名称
        // 混淆处理属性（会修改对象的属性名，如果代码有动态调用属性时可能会无法正常运行），默认 false （不处理属性）
        // 开启属性混淆后会修改 nameCache.props 数据，用于其它脚本映射对应的混淆
        properties: {
            builtins: false, // 混淆内置API的属性（包括 prototype），不建议开启
            cache: options.nameCache && (options.nameCache.props || {}),  // 已经缓存的混淆对应名（对应名不会识别所属是否匹配）
            debug: false, // 混淆后的属性名包含原始名
            keep_quoted: false, // 是否不混淆使用引号调用的属性名（比如： this['attr']），此开关只针对可明确引号中的属性名时有效（比如： this['attr' + key] 就无效）
            nth_identifier: base54, // 混淆时生成的新命令处理器，有内置的，可以命令为特殊符号的名称
            only_cache: false, // 只混淆已经缓存的属性名
            regex: null,  // 仅混淆正则匹配的属性名
            reserved: null, // 禁止混淆的属性名数组集合
            undeclared: false, // 不混淆顶层属性名
            only_annotated: false, // 只修改使用 /*@__MANGLE_PROP__*/ 定义的属性（注解属性）。
        },
        reserved: [], // 禁止混淆的局部变量名数组集合
        safari10: false, // 绕过 Safari 10 循环迭代器错误，let 两次
        toplevel: false, // 是否混淆顶层类&函数&变量名
    },
    module: false, // 全局是否在ES6模块时自动按 use strict 处理（会覆盖 parse、compress、mangle）
    nameCache: null, // 缓存混淆后的类名、属性名、全局变量名对应表，用于其它代码混淆使用（读写选项）
    output: null, // 与 format 一样（可以理解别名），二选一
    format: { // 输出格式，与 output 一样（可以理解别名），二选一
        ascii_only: false, // 将所有非 ASCII 字符进行Unicode 字符转义，该选项会替换代码所有匹配的字符串
        beautify: false, // 是否美化输出（已弃用）
        braces: false, // 始终在 if、for、while、with 语句块中插入大括号
        // 是否保留注释
        // 可先参数：
        //      'some'      保留 /@preserve|@copyright|@lic|@cc_on|^\**!/ 注释，只匹配 comment1 & comment2 注释（默认值）
        //      true        保留所有注释
        //      false       去掉所有注释
        //      string      保留注释匹配正则字符串，只匹配非 comment5 注释
        //      RegExp      保留注释匹配正则，只匹配非 comment5 注释
        //      function    保留注释匹配的回调函数，只匹配非 comment5 注释
        // 注释分类：
        //      comment1    以 // 开始的注释
        //      comment2    以 /*  */ 结构的注释
        //      comment3    在html中以 <!-- 开始的注释
        //      comment4    在html中以 --> 结束的注释
        //      comment5    在代码开始处以 #! 开始的代码
        comments: "some",
        ecma: 5,   // ES输出版本（针对部分法语转换），可传 5, 2015, 2016 , 2017
        ie8: false, // 是否支持到IE8
        indent_level: 4,   // 美化输出时代码缩进一级空格个数
        indent_start: 0,   // 所有行添加默认空格数
        inline_script: true,    // ----------- ??
        keep_numbers: false,  // 保持数字与原始代码相同，比如： 1000000 转为 1e6
        keep_quoted_props: false,  // ----------- ??
        max_line_len: false, // 输出的代码一行最多字符数，false 为不限制， > 0 为指定字符数后强制换行（会保证代码的正确性）
        preamble: null, // 特殊字符串（必需保证字符串符合代码结构，否则输出后的代码可能无法正常使用）插入输出代码的前面，可用于放置许可信息
        // 是否保留 Terser 专用注释
        //  Terser 注释类型
        //      /*@__INLINE__*/- 强制函数在某处内联。
        //      /*@__NOINLINE__*/- 确保被调用的函数没有内联到调用站点中。
        //      /*@__PURE__*/- 将函数调用标记为 pure。这意味着，它可以安全地丢弃。
        //      /*@__KEY__*/- 将字符串文本标记为属性，以便在重整属性时也对其进行 mangle 处理。
        //      /*@__MANGLE_PROP__*/- 启用属性 mangler 时，选择加入对象属性（或类字段）进行 mangling。
        preserve_annotations: false,
        quote_keys: false, // ----------- ??
        // 字符串引号定义
        // 可选值：
        //      0       优先使用双引号，如果字符串内包含双引号则改为单引号，尽可能减少引号转义
        //      1       永远使用单引号
        //      2       永远使用双引号
        //      3       保留沿用原代码引号
        quote_style: 0,
        safari10: false, // 是否兼容 safari10
        semicolons: true,  // 是否使用分号分隔语句，否则使用换行分隔语句
        shebang: true, // 是否保留代码顶部的 #! 部分（主要用于bash脚本）
        shorthand: undefined,  // 开启压缩对象属性以简洁语法输出，隐藏选项 shorthand = shorthand || ecma > 5
        source_map: null, // 无效
        webkit: false, // 启用WebKit错误解决， PhantomJS项目使用此选项
        width: 80, // 指定一行最多代码字符个数，受beautify影响，用于美化输出代码
        wrap_iife: false, // 完善闭包结构，比如： !function(){}() 改为 !(function(){})();
        wrap_func_args: true, // ----------- ??

        _destroy_ast: false  // 箭头函数输出完后就释放代码数据，可能会有未知问题
    },
    parse: { // 解析选项
        bare_returns: false,  // 支持顶层return语句，不开启在顶层使用return报错
        ecma: null,  // 无效
        expression: false, // ----------- ??
        filename: null,  // 当前要解析的文件名，解析报错时可提取
        html5_comments: true, // 是否支持解析html注释代码
        module: false, // 使用严格模式解析（未声明变量使用不验证）
        shebang: true, // 是否支持解析代码首行 #!command
        strict: false, // 严格要求 } 、 ] 之前的代码必需是 ; 或 非 ,
        toplevel: null, // 内部处理参数，外部不可用
    },
    rename: undefined, // 暂未发现使用
    safari10: false, // （有效时覆盖）全局是否兼容 safari10（会覆盖 mangle、format）
    sourceMap: {  // 指定生成源映射（用于浏览器调试时自动映射到原代码方便定位问题，生产环境不建议使用），默认 false
        asObject: false,  // 映射内容获取是以对象还是json串返回，(await minify(code, {sourceMap:{asObject: true}})).map 
        content: null, // 指定映射文件内容（必需是映射编码代码），也可以使用 inline 将使用原码中的映射 //# sourceMappingURL= 内容
        filename: null, // 映射的文件名，会生成在映射文件中
        includeSources: false, // 映射文件里是否包含当前原代码，会写到映射文件的 sourcesContent 中
        root: null,  // 映射源文件根全路径（包含域名）
        url: null,   // 映射源 .map 文件地址，也可以用 'inline' 则将映射代码写到解析压缩后的代码中。指定后会在输出的代码最后一行增加 //# sourceMappingURL=${sourceMap.url}
    },
    spidermonkey: false, // ----------- ??
    timings: false, // 是否获取各解析压缩等操作时长（秒）
    toplevel: false, // （有效时覆盖）全局删除顶层未使用的函数或变量（会覆盖 compress、mangle）
    warnings: false, // （有效时覆盖）全局已遗弃（会覆盖 compress）
}

module.exports.run = async function (code, options) {
    await minify(code, options);
}
