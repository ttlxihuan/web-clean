/**
 * 路径处理
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const urllib = require('url');
const https = require('https');
const crypto = require('crypto');
let { mergeOptions } = require('../options');
const filesystem = require('../filesystem');
const Token = require('clean-css/lib/tokenizer/token');
let { configConvertIdentifier } = require('../identifier');

const tmpBaseDir = os.tmpdir() + '/web-clean-tmp/';

function encryptMD5(source) {
    const md5 = crypto.createHash('md5');
    return md5.update(source).digest('hex');
}

function getExt(uri) {
    return (path.basename(uri).match(/\.([^\.]+)$/) || ['', ''])[1].toLocaleLowerCase();
}
let tmpRealPaths = {};
function getTmpDir(baseDir) {
    if (tmpRealPaths[baseDir] === undefined) {
        tmpRealPaths[baseDir] = tmpBaseDir + encryptMD5(filesystem.realpath(baseDir));
        filesystem.mkdirs(tmpRealPaths[baseDir]);
    }
    return tmpRealPaths[baseDir];
}


// 下载远程资源文件
function download(url, filename) {
    function getProtocol() {
        return /^http:/i.test(url) ? http : https;
    }
    return new Promise((resolve, reject) => {
        if (filesystem.exist(filename)) {
            resolve(url, filename);
            return;
        }
        var timer = setTimeout(function () {
            req.abort();
            fail('timeout.');
        }, 30 * 1000);
        function fail(msg) {
            clearTimeout(timer);
            console.error('[download] ( ' + msg + ' ) ' + url + ' => ' + filename);
            reject();
        }
        const req = getProtocol().get(url, (response) => {
            // 检查响应状态码
            if (response.statusCode !== 200) {
                fail('response status: ' + response.statusCode);
                return;
            }
            filesystem.mkdirs(path.dirname(filename));
            const fileStream = fs.createWriteStream(filename);
            // 管道流：响应数据写入文件
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.info('[download] success ' + url + ' => ' + filename);
                clearTimeout(timer);
                resolve(url, filename);
            });
            fileStream.on('error', (err) => {
                fs.unlink(filename, () => { }); // 删除未完成的文件
                fail(err.message);
            });
        }).on('error', (err) => {
            fail(err.message);
        });
        req.end();
    });
}

// 分离目录
function splitPath(pathname) {
    var arr = [];
    pathname.replace(/^(\.?\/+)+/, '').replace(/\/\/+/g, '/').split(/\//g).forEach(item => {
        if (item === '.' || item === '') {
            return;
        }
        if (item === '..' && arr.length > 0) {
            arr.pop();
            return;
        }
        arr.push(item);
    });
    return arr;
}

function abstractPath(pathname, relativePath) {
    if (pathname[0] === '/') {
        // 绝对路径
        return pathname;
    }
    let arr = splitPath(path.dirname(relativePath));
    splitPath(pathname).forEach(item => {
        if (item === '..') {
            if (arr.pop() === undefined) {
                throw new Error('Incorrect path: ' + pathname);
            }
        } else {
            arr.push(item);
        }
    });
    return '/' + arr.join('/');
}


function relativePath(pathname, relativePath) {
    let arr = splitPath(pathname);
    if (pathname[0] === '/') {
        // 相对路径
        let relativeArr = splitPath(path.dirname(relativePath));
        for (var key = 0; key < arr.length; key++) {
            if (relativeArr.length > key && relativeArr[key] === arr[key]) {
                continue;
            }
            break;
        }
        return Array(Math.max(relativeArr.length - key, 0)).fill('..').concat(arr.slice(key)).join('/');
    } else {
        return arr.join('/');
    }
}

function createLocalization(webOptions) {
    // 下载远程资源文件记录
    let downloads = {};

    // 资源文件标识符
    let resourceFileIdentifiers = {};
    let resourceFileMappings = [];

    let mangleLocalizeOptions = false;
    if (webOptions.mangleLocalize) {
        if (typeof webOptions.mangleLocalize === 'object') {
            mangleLocalizeOptions = function () {
                return Object.assign({}, webOptions.mangleLocalize);
            };
        } else if (typeof webOptions.mangleLocalize === 'function') {
            mangleLocalizeOptions = webOptions.mangleLocalize;
        } else {
            mangleLocalizeOptions = () => { };
        }
    }
    function mangleResourceFileIdentifier(pathname) {
        if (mangleLocalizeOptions) {
            const _ext = getExt(pathname);
            let _pathname = pathname.replace(/(^[\\\/]+)|([\\\/]+$)/g, '');
            if (resourceFileIdentifiers[_ext] === undefined) {
                resourceFileIdentifiers[_ext] = configConvertIdentifier({ mangleLocalize: mangleLocalizeOptions }, 'mangleLocalize');
                resourceFileIdentifiers[_ext].reset(['lower', 'num', 'other'], null);
            }
            return (webOptions.absolutePath ? '/' : '') + resourceFileIdentifiers[_ext].get(_pathname).split('').join('/') + '.' + _ext;
        }
        return pathname;
    }
    // url压缩处理
    function urlMinifier(pathname, targetDir, downloadUrl = null) {
        if (downloadUrl) {
            let downloadDir = getTmpDir(filesystem.realpath(targetDir));
            resourceFileMappings.push([downloadUrl, downloadDir, targetDir, pathname]);
        } else {
            return mangleResourceFileIdentifier(pathname);
        }
    }
    // 解析资源路径
    function parseLocalization(targetDir, pathname) {
        let transformationPath = webOptions.absolutePath ? abstractPath : relativePath;
        let downloadDir = getTmpDir(filesystem.realpath(targetDir));
        function localization(targetUrl, sourceUrl) {
            if (!/\.[^\/\.]+$/.test(targetUrl)) { // 没有后缀跳过处理
                return targetUrl
            }
            if (/\t([a-z0-9]{1,11})\d+\1\t/i.test(targetUrl)) { // 有占位符，自行跳过
                return targetUrl;
            }
            // 已经是本地的，或者没有后缀的均不处理
            let targetStruct = urllib.parse(targetUrl);
            if (targetStruct.host === null && typeof sourceUrl === 'string') {
                // 相对某个url地址的路径
                let surl = urllib.parse(sourceUrl);
                if (surl.protocol && surl.host) {
                    if (/^\/\/[^/]+\//.test(targetUrl)) {
                        targetUrl = surl.protocol + targetUrl;
                        targetStruct = urllib.parse(targetUrl);
                    } else {
                        let turl = urllib.parse(targetUrl);
                        surl = new urllib.URL(sourceUrl);
                        surl.pathname = abstractPath(turl.pathname, surl.pathname);
                        targetUrl = surl.href
                    }
                    targetStruct = urllib.parse(targetUrl);
                }
            }
            var _pathname = targetStruct.pathname;
            // 下载远程文件
            if (/https?/.test(targetStruct.protocol)) {
                if (!webOptions.localize) {
                    return targetStruct.href;
                }
                if (downloads[_pathname] === undefined) {
                    downloads[_pathname] = download(targetUrl, downloadDir + _pathname).then(function () {
                        urlMinifier(abstractPath(_pathname, pathname), targetDir, targetUrl);
                    }).catch(function (err) { });
                }
            }
            // 混淆压缩路径
            let _url = '/' + urlMinifier(abstractPath(_pathname, pathname), targetDir);
            return transformationPath(_url, pathname);
        }
        return localization;
    }

    // 本地化配置，会下载所有远程文件到本地，并替换远程文件连接地址
    // 本地化压缩配置，会减化本地资源路径
    const localize = webOptions.localize || webOptions.mangleLocalize;
    let plugins = webOptions.cssOptions.plugins || [];
    function localizationCssOptions(targetDir, sourceFile, cssOptions, downloadUrl) {
        if (localize) {
            localization = parseLocalization(targetDir, sourceFile, webOptions);
            cssOptions.plugins = [].concat(plugins);
            function parseUrl(value) {
                return value.replace(/url\s*\(([^)]+)\)/ig, function (_, url) {
                    const quote = (url.match(/^['"]/) || [''])[0];
                    return 'url(' + quote + localization(url.replace(/^['"]+|["']+$/g, ''), downloadUrl) + quote + ')';
                });
            }
            cssOptions.plugins.push({
                level2: {
                    block: function (tokens) {
                        tokens.forEach(token => {
                            switch (token[0]) {
                                case Token.RULE: // 提取 url()
                                    token[2].forEach(property => {
                                        for (var i = 2; i < property.length; i++) {
                                            property[i][1] = parseUrl(property[i][1]);
                                        }
                                    });
                                    break;
                                case Token.AT_RULE: // 提取 @import
                                    if (/^@import\s+/i.test(token[1])) {
                                        token[1] = parseUrl(token[1]);
                                    }
                                    break;
                                case Token.AT_RULE_BLOCK:
                                    if (/^@font-face$/i.test(token[1][0][1])) {
                                        token[2].forEach(property => {
                                            if (/^src$/i.test(property[1][1])) {
                                                for (var i = 2; i < property.length; i++) {
                                                    property[i][1] = parseUrl(property[i][1]);
                                                }
                                            }
                                        });
                                    }
                                    break;
                            }
                        })
                    }
                }
            });
        }
        return cssOptions;
    }

    let sortAttributes = webOptions.htmlOptions.sortAttributes || function () { };
    let htmlUrlTags = /^(img|link|script|source|video|audio|embed|object)$/i;
    function localizationHtmlOptions(targetDir, sourceFile, htmlOptions, downloadUrl) {
        if (localize) {
            localization = parseLocalization(targetDir, sourceFile, webOptions);
            htmlOptions.sortAttributes = function (tag, attrs) {
                if (htmlUrlTags.test(tag)) {
                    attrs.forEach(({ name, value }, key) => {
                        if (value && /^(src|href)$/i.test(name)) {
                            attrs[key].value = localization(value, downloadUrl);
                        }
                    })
                }
                sortAttributes(tag, attrs);
            };
        }
        return htmlOptions;
    }

    async function waitAllDownload() {
        await Promise.all(Object.values(downloads));
    }

    let updateOptions = { css: localizationCssOptions, html: localizationHtmlOptions };
    function dynamicOptions(name, pathname, targetDir, options, downloadUrl) {
        if (updateOptions[name] !== undefined) {
            return updateOptions[name](targetDir, pathname, options, downloadUrl);
        }
        return options;
    }

    return { dynamicOptions, waitAllDownload, resourceFileMappings, mangleResourceFileIdentifier };
}

module.exports = { createLocalization }