/**
 * 创建简易的压缩处理器，用于提取标识
 */
let { createMinifier } = require('../minify');
let { createLocalization } = require('./localization');
let { mangleCssIdentifiers, mangleHtmlIdentifiers } = require('./mangle');
let { convertIdentifier, agileIdentifiers } = require('../identifier');


function isRemoveIdentifiers() { return false; }

function newIdentifiers(keys) {
    let _options = {};
    let _identifiers = {};
    keys.forEach(function (key) {
        _options[key] = {};
        _identifiers[key] = convertIdentifier(_options[key]);
    });
    return [agileIdentifiers(_identifiers, isRemoveIdentifiers), _options];
}


/**
 * 创建新的css和html压缩处理器
 * @returns 
 */
function newCssAndHTMLIdentifiers(webOptions) {
    let [cssIdentifiers, _cssOptions] = newIdentifiers(['id', 'class', 'var-def', 'var-use', 'tag', 'font-def', 'font-use', 'keyframes-def', 'keyframes-use']);
    let [htmlIdentifiers, _htmlOptions] = newIdentifiers(['id', 'id-use', 'class', 'tag']);
    let cssOptions = {
        level: {
            1: { all: false },
            2: { all: false, removeEmpty: true }
        },
        plugins: [{
            level2: {
                block: mangleCssIdentifiers(cssIdentifiers, webOptions.ignoreCssSelectorError)
            }
        }]
    };
    let htmlOptions = {
        customAttrSurround: webOptions.htmlOptions.customAttrSurround || [],
        ignoreCustomFragments: webOptions.htmlOptions.ignoreCustomFragments || [],
        sortAttributes: mangleHtmlIdentifiers(htmlIdentifiers, function () { return false; }),
        continueOnParseError: webOptions.htmlOptions.continueOnParseError || false
    };

    let options = {
        makeSourceMap: false,
        localize: webOptions.localize,
        mangleLocalize: webOptions.mangleLocalize,
        useSass: webOptions.useSass,
        cssOptions,
        htmlOptions
    };

    let localization = createLocalization(options);
    let minifiers = createMinifier(options, localization.dynamicOptions, localization.mangleResourceFileIdentifier);

    return [minifiers, _cssOptions, _htmlOptions, localization];
}

module.exports = { newCssAndHTMLIdentifiers }
