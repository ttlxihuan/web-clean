// 配置说明，版本 clean-css 1.0.0

const WebClean = require('web-clean');


module.exports.run = async function (paths, options = {}, template = null) {
    let webClean = new WebClean(options, template);
    paths.forEach(item => {
        webClean.addPath(item[0], item[1]); // 添加要压缩处理的 源目录 => 目标目录
    });
    webClean.run();
}
