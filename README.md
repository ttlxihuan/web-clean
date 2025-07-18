# web-clean
针对web网站的html & js & css 整体压缩处理，可以适应标签模板压缩

## 优点
- 可压缩整站html和css文件 class、id。重命名混淆，可指定重命名。
- 可压缩整站css文件的 var、font-family、animation-name。重命名混淆，可指定重命名。
- 可删除整站css文件中未使用的 class、id、font-family、animation-name
- 压缩js代码

## 缺点
- css中的字体或动画名使用变量时无法提取实际名，需通过要删除配置项进行指定不删除
- 选择器的实际层级关系无法确认，导致无法删这类未使用的样式代码
- html模板处理需要额外指定解析配置正则
- js中引用的 class & id 无法转换，需要指定混淆配置项进行处理
- 不支持ts压缩转换处理
- css & js 语句不支持模板标签

## 安装
```
npm install web-clean
```

## html 压缩
依赖 [html-minifier-terser](https://github.com/terser/html-minifier-terser)
- 批量删除多余的属性
- 批量删除未使用的class & id
- 去掉多余的空格或换行
- 增加标签匹配正则选项可以匹配到标签模板，实现动态页面
- 压缩页面内的js & css 代码（参考对应的压缩）
- 混淆压缩 class & id
- 支持 blade 模板压缩

## js 压缩
依赖 [terser](https://github.com/terser/terser)
- 默认配置

## css 压缩
依赖 [clean-css](https://github.com/clean-css/clean-css) & [sass](https://github.com/sass/dart-sass)
- 使用clean-css的2级压缩

## 其它文件
- 原路复制到目标目录

## 配置说明
配置名              |数据类型            |默认值         |配置说明
:-------------------|:------------------|:---------------|:---------------
cssOptions          |object\|Function(WebClean, cssMinifier)   |[查看](lib/options.js)          |css压缩配置信息[参考](demo/css.js)
cssFileRule         |string\|RegExp     |css             |css文件匹配后缀名或正则
jsOptions           |string\|Function(WebClean, jsMinifier)   |[查看](lib/options.js)          |js压缩配置信息[参考](demo/js.js)
jsFileRule          |string\|RegExp     |js              |js文件匹配后缀名或正则
htmlOptions         |string\|Function(WebClean, htmlMinifier)   |[查看](lib/options.js)          |html压缩配置信息[参考](demo/html.js)
htmlFileRule        |string\|RegExp     |html|htm        |html文件匹配后缀名或正则
mangleClassIdentifiers         |false\|Object  |{}          |指定混淆class名的对照表（影响 html、css 文件），默认会生成混淆名
mangleIdIdentifiers            |false\|Object  |{}          |指定混淆id名的对照表（影响 html、css 文件），默认会生成混淆名
mangleCssVarIdentifiers        |false\|Object  |{}          |指定混淆css变量名的对照表（影响 html、css 文件），默认会生成混淆名
mangleCssKeyframesIdentifiers  |false\|Object  |{}          |指定混淆css动画名的对照表（影响 html、css 文件），默认会生成混淆名
mangleCssFontIdentifiers       |false\|Object  |{}          |指定混淆css字体名的对照表（影响 html、css 文件），默认会生成混淆名
cleanUnused         |boolean            |true               |是否删除未使用的id、class、var、font、animation。总开关
removeUnusedIds             |false\|Object  |{}               |要删除的css的id选择器代码块（html中未使用），单独保留时使用 { "id名": false }
removeUnusedClasses         |false\|Object  |{}               |要删除的css的class选择器代码块（html中未使用），单独保留时使用 { "class名": false }
removeUnusedCssVars         |false\|Object  |{}               |要删除的css的变量代码块（定义和使用），单独保留时使用 { "var名": false }
removeUnusedCssTags         |false\|Object  |{}               |要删除的css的标签选择器代码块（html中未使用），单独保留时使用 { "标签名": false }
removeUnusedCssKeyframes    |false\|Object  |{}               |要删除的css的动画代码块（定义和使用），单独保留时使用 { "动画名": false }
removeUnusedCssFonts        |false\|Object  |{}               |要删除的css字体样式代码（定义和使用），单独保留时使用 { "字体名": false }
removeHtmlAttrs       |Array\|Object\|Function(tag, attrName, attrValue)  |{}               |要删除的html属性
makeSourceMap               |boolean            |false               |是否生成map文件，不建议开启
skipFileRule                |false\|RegExp\|string            |false               |跳过处理文件
ignoreCssSelectorError      |boolean            |true                |忽略css选择器错误语句
                                    
## 示例
```js
const WebClean = require('web-clean');
let webClean = new WebClean({}, 'blade'); // 压缩blade模板
webClean.addPath('要压缩的源目录', '想保存的目标目录');
webClean.run();
```
