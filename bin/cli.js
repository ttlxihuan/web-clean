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
program.option("--skip-file-exts [exts]", "Skip the compression file extension.");
program.option("--skip-control-css", "Skip the compression and obfuscation of CSS properties such as id, class, var, and fonts for the control elements. When there are js files with the same name, they are regarded as control styles.");

// css&html混淆压缩选项
program.option("--no-mangle", "Do not compress id, class, vars, fonts, and animation names.");
program.option("--skip-mangle-ids [ids]", "Do not compress ids.");
program.option("--skip-mangle-classes [classes]", "Do not compress classes.");
program.option("--skip-mangle-vars [vars]", "Do not compress vars.");
program.option("--skip-mangle-key-frames [frames]", "Do not compress key-frames.");
program.option("--skip-mangle-fonts [fonts]", "Do not compress fonts.");

// 删除未使用代码
program.option("--no-clean-unused", "Disable and delete unused classes, ids, vars, attributes, etc. for styles or properties.");
// 保存不删除
program.option("--keep-ids [ids]", "Keep ids, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-classes [classes]", "Keep classes, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-vars [vars]", "Keep vars, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-key-frames [frames]", "Keep key-frames, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-fonts [fonts]", "Keep fonts, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--keep-tags [tags]", "Keep tags, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
// 不保留直接删除
program.option("--clean-ids [ids]", "Delete ids, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-classes [classes]", "Delete classes, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-vars [vars]", "Delete vars, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-key-frames [frames]", "Delete key-frames, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-fonts [fonts]", "Delete fonts, separated by multiple commas. Using the --no-clean-unused option is ineffective.");
program.option("--clean-tags [tags]", "Delete tags, separated by multiple commas. Using the --no-clean-unused option is ineffective.");

// 其它选项
program.option("--error-exit", "Compression error occurred and has stopped.", false);

if (process.argv.length <= 2) {
    program.help();
}

program.parse(process.argv);


const _options = program.opts();

let options = {};

if (_options.optionsFile) {
    options = jsonParse(fs.readFileSync(_options.optionsFile, 'utf-8'));
}
if (_options.cssOptions) {
    options.cssOptions = _options.cssOptions;
}
if (_options.jsOptions) {
    options.jsOptions = _options.jsOptions;
}
if (_options.htmlOptions) {
    options.htmlOptions = _options.htmlOptions;
}
if (_options.cssExts) {
    options.cssFileRule = _options.cssExts;
}
if (_options.jsExts) {
    options.jsFileRule = _options.jsExts;
}
if (_options.htmlExts) {
    options.htmlFileRule = _options.htmlExts;
}
function toConfig(identifiers, value = null) {
    var arr = identifiers.split(/[,\s]/g), config = {};
    for (var key = 0; key < arr.length; key++) {
        config[arr[key]] = value !== null ? value : arr[key];
    }
    return config;
}

if (_options.mangle) {
    options.htmlTemplate = _options.htmlTemplate;
    if (_options.skipMangleIds) {
        options.mangleIdIdentifiers = toConfig(_options.skipMangleIds);
    }
    if (_options.skipMangleClasses) {
        options.mangleClassIdentifiers = toConfig(_options.skipMangleClasses);
    }
    if (_options.skipMangleVars) {
        options.mangleCssVarIdentifiers = toConfig(_options.skipMangleVars);
    }
    if (_options.skipMangleKeyFrames) {
        options.mangleCssKeyframesIdentifiers = toConfig(_options.skipMangleKeyFrames);
    }
    if (_options.skipMangleFonts) {
        options.mangleCssFontIdentifiers = toConfig(_options.skipMangleFonts);
    }
} else {
    options.mangleClassIdentifiers = false;
    options.mangleIdIdentifiers = false;
    options.mangleCssVarIdentifiers = false;
}

if (_options.cleanUnused) {
    options.cleanUnused = true;
    if (_options.keepIds) {
        options.removeUnusedIds = toConfig(_options.keepIds, true);
    }
    if (_options.keepClasses) {
        options.removeUnusedClasses = toConfig(_options.keepClasses, true);
    }
    if (_options.keepVars) {
        options.removeUnusedCssVars = toConfig(_options.keepVars, true);
    }
    if (_options.keepKeyFrames) {
        options.removeUnusedCssKeyframes = toConfig(_options.keepKeyFrames, true);
    }
    if (_options.keepFonts) {
        options.removeUnusedCssFonts = toConfig(_options.keepFonts, true);
    }
    if (_options.keepTags) {
        options.removeUnusedCssTags = toConfig(_options.keepTags, true);
    }
    if (_options.cleanIds) {
        options.removeUnusedIds = toConfig(_options.cleanIds, false);
    }
    if (_options.cleanClasses) {
        options.removeUnusedClasses = toConfig(_options.cleanClasses, false);
    }
    if (_options.cleanVars) {
        options.removeUnusedCssVars = toConfig(_options.cleanVars, false);
    }
    if (_options.cleanKeyFrames) {
        options.removeUnusedCssKeyframes = toConfig(_options.cleanKeyFrames, false);
    }
    if (_options.cleanFonts) {
        options.removeUnusedCssFonts = toConfig(_options.cleanFonts, false);
    }
    if (_options.cleanTags) {
        options.removeUnusedCssTags = toConfig(_options.cleanTags, false);
    }
} else {
    options.cleanUnused = false;
}
if (_options.skipFileExts) {
    options.skipFileRule = _options.skipFileExts;
}
if (_options.skipControlCss) {
    options.skipControlCss = true;
}
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
