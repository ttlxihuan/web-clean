#!/usr/bin/env node
"use strict"

const fs = require('fs');
const WebClean = require("../index");
const program = require("commander");
const packageJson = require("../package.json");

function jsonParse(str) {
    return JSON.parse(str);
}

function dirParse(dirname, previous) {
    if (fs.statSync(dirname).isDirectory()) {
        previous.push(dirname);
        return previous;
    }
    throw new program.InvalidArgumentError('Not a directory: ' + dirname);
}


function fileParse(filename) {
    if (fs.statSync(filename).isFile()) {
        return filename;
    }
    throw new program.InvalidArgumentError('Not a file: ' + filename);
}
function toConfig(identifiers, value = null) {
    var arr = identifiers.split(/[,\s]/g), config = {};
    for (var key = 0; key < arr.length; key++) {
        config[arr[key]] = value !== null ? value : arr[key];
    }
    return config;
}

program.name(packageJson.name);
program.version(packageJson.name + ' ' + packageJson.version);

program.argument("<output-dir>", 'Compressed output directory.');
program.argument("[source-dir...]", 'Compress source directory.', dirParse, ['./']);

// 文件后缀配置
program.option("--css-exts [exts]", "CSS extension name.", 'css');
program.option("--js-exts [exts]", "javascript extension name.", 'js');
program.option("--html-exts [exts]", "HTML extension name.", 'html|htm');

// 模板名
program.option("--html-template [name]", "HTML template name. Optional: blade");

// 压缩选项
program.option("--css-options [json]", "CSS compression options. JSON format.", jsonParse);
program.option("--js-options [json]", "javascript compression options. JSON format.", jsonParse);
program.option("--html-options [json]", "HTML compression options. JSON format.", jsonParse);

// 压缩选项配置文件
program.option("--options-file [file]", "Compress the option configuration file in JSON format.", fileParse);
program.option("--skip-exts [exts]", "Skip the compression file extension.");
program.option("--ignore-exts [exts]", "Ignore the file extension.");
program.option("--skip-control-css", "Skip the compression and obfuscation of CSS properties such as id, class, var, and fonts for the control elements. When there are js files with the same name, they are regarded as control styles.");

// css&html混淆压缩选项
program.option("--no-mangle", "Do not compress id, class, vars, fonts, and animation names.");
program.option("--skip-mangle-id [ids]", "Do not compress ids.");
program.option("--skip-mangle-class [classes]", "Do not compress classes.");
program.option("--skip-mangle-css-var [vars]", "Do not compress vars.");
program.option("--skip-mangle-css-key-frames [frames]", "Do not compress key-frames.");
program.option("--skip-mangle-css-font [fonts]", "Do not compress fonts.");

// 删除未使用代码
program.option("--no-clean-unused", "Disable and delete unused classes, ids, vars, attributes, etc. for styles or properties.");
// 保存不删除
program.option("--keep-ids [ids]", "Keep ids, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-classes [classes]", "Keep classes, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-css-vars [vars]", "Keep vars, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-css-key-frames [frames]", "Keep key-frames, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-css-fonts [fonts]", "Keep fonts, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-css-tags [tags]", "Keep tags, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
// 不保留直接删除
program.option("--clean-ids [ids]", "Delete ids, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-classes [classes]", "Delete classes, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-css-vars [vars]", "Delete vars, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-css-key-frames [frames]", "Delete key-frames, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-css-fonts [fonts]", "Delete fonts, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-css-tags [tags]", "Delete tags, separated by multiple commas. Using the --no-clean-unused option is ineffective.");

// 其它选项
program.option("--css-error-exit", "CSS error, program exited.", false);
program.option("--localize", "Localize all resources. Remote resources will be automatically downloaded and transferred to the local area.", false);
program.option("--mangle-localize [paths]", "Confusing the local resource path and file name.");
program.option("--absolute-path", "All local resources use absolute paths by default, with relative paths being the alternative.", false);
program.option("--base-url [url]", "Specify the local base URL address. Using the --localize option is ineffective.", false);
program.option("--make-source-map", "Generate source map files for compressed files.", false);

if (process.argv.length <= 2) {
    program.help();
}

program.parse(process.argv);

const _options = program.opts();

let options = {};

if (_options.optionsFile) {
    options = jsonParse(fs.readFileSync(_options.optionsFile, 'utf-8'));
}

['css', 'js', 'html'].forEach(key => {
    let name = key + 'Options';
    if (_options[name]) {
        options[name] = _options[name];
    }
});

['css', 'js', 'html', 'skip', 'ignore'].forEach(key => {
    let ext = key + 'Exts';
    let actExt = key + 'FileRule';
    if (_options[ext]) {
        options[actExt] = _options[ext];
    }
});

options.htmlTemplate = _options.htmlTemplate || null;

if (_options.mangle) {
    ['Id', 'Class', 'CssVar', 'CssKeyFrames', 'CssFont'].forEach(key => {
        let cliOpt = 'skipMangle' + key;
        let actOpt = 'mangle' + key + 'Identifiers';
        if (_options[cliOpt]) {
            options[actOpt] = toConfig(_options[cliOpt]);
        }
    });
} else {
    options.mangleClassIdentifiers = options.mangleIdIdentifiers = options.mangleCssVarIdentifiers = options.mangleCssKeyframesIdentifiers = options.mangleCssFontIdentifiers = false;
}

options.cleanUnused = _options.cleanUnused;
if (_options.cleanUnused) {
    ['Ids', 'Classes', 'CssVars', 'CssKeyFrames', 'CssFonts', 'CssTags'].forEach(name => {
        let keepOpt = 'keep' + name;
        let actOpt = 'removeUnused' + name;
        if (_options[keepOpt]) {
            options[actOpt] = toConfig(_options[keepOpt], true);
        }
        let cleanOpt = 'clean' + name;
        if (_options[cleanOpt]) {
            options[actOpt] = toConfig(_options[cleanOpt], false);
        }
    });
}

if (options.mangleLocalize) {
    options.mangleLocalize = toConfig(_options.mangleLocalize);
}

['makeSourceMap', 'skipControlCss', 'localize', 'absolutePath', 'baseUrl'].forEach(key => {
    options[key] = _options[key];
});

options.ignoreCssSelectorError = !_options.errorExit;

let webclean = WebClean(options, _options.htmlTemplate || null);

const [output_dir, source_dirs] = program.processedArgs;
if (source_dirs.length > 1) {
    source_dirs.shift()
}

source_dirs.forEach(source_dir => {
    webclean.addPath(source_dir, output_dir);
    console.info(source_dir)
})

webclean.run();
