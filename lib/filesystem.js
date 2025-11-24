/**
 * 文件处理
 */

const fs = require('fs');
const path = require('path');

function existsFs(filepath) {
    try {
        fs.accessSync(filepath, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

function realpath(_path) {
    if (!existsFs(_path)) {
        throw Error('path does not exist: ' + _path);
    }
    return fs.realpathSync(_path, { encoding: 'utf-8' }).replace(/\\/, '/');
}

function* scanFile(_dir) {
    if (!existsFs(_dir)) {
        throw Error('dir does not exist: ' + _dir);
    }
    let items = fs.readdirSync(_dir, { encoding: 'utf-8' });
    for (let filepath, key = 0; key < items.length; key++) {
        filepath = realpath(_dir + '/' + items[key]);
        if (fs.statSync(filepath).isFile()) {
            yield filepath
        } else {
            yield* scanFile(filepath)
        }
    }
}

function read(filename) {
    if (existsFs(filename, fs.constants.F_OK | fs.constants.R_OK)) {
        return fs.readFileSync(filename, { encoding: 'utf-8' });
    } else {
        throw Error('Unable to read the file ' + filename);
    }
}

function write(filename, contents) {
    mkdirs(path.dirname(filename));
    fs.writeFileSync(filename, contents, { encoding: 'utf-8' });
}

// 递归地创建目录
function mkdirs(dir) {
    if (!existsFs(dir)) {
        mkdirs(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}

function copy(sourceFile, targetFile) {
    mkdirs(path.dirname(targetFile));
    fs.copyFileSync(sourceFile, targetFile);
}

module.exports = {
    exist: existsFs,
    scan: scanFile,
    read,
    write,
    mkdirs,
    copy,
    realpath
};