/**
 * 混淆缩小处理
 */

const { process } = require('clean-css');
const Token = require('clean-css/lib/tokenizer/token');


function mangleCssIdentifiers(identifiers, ignoreError) {
    let attrReg = /^\[\s*(class|id)\s*([~]?=)\s*("([^"\\]+|\\.)*"|'([^'\\]+|\\.)*'|[^\]]+)\s*\]$/ig
    var varDefReg = /^--.+/
    var varUseReg = /(?:^|[\s\(\)\+\-\*%/])var\s*\(\s*--(([^\s()\\,]+|\\.)+)\s*(,.*?)?\)/
    var selectorsReg = [
        /^([#.])([^\s:+.>\[\]\(\)|,~#)\\]+|\\.)+/, // id & class
        /^\[\s*([^\s~|^$*=\]]+)\s*(([~|^$*]?=)\s*("([^"\\]+|\\.)*"|'([^'\\]+|\\.)*'|[^\]]+)\s*)?\]/i, // attr
        /^\d+%/, // keyframes
        /^([\w\-]+|\*)/, // tag
        /^:{1,2}[\w\-]+/, // Pseudo-classes，Pseudo-element
        /^\s*[>+~]\s*/, // tier
        /^\s*,\s*/, // split
        /^\s+/, // tier
        /^\s*&\s*/, // Nesting
    ];
    var selectorErrorReg = /^\s*([^\s:+.>\[\]\(\)|,~#)\\]+|\\.)+/;
    var fontGenericReg = /(cursive|default|emoji|fangsong|fantasy|inherit|initial|math|monospace|revert|revert-layer|sans-serif|serif|system-ui|ui-monospace|ui-rounded|ui-sans-serif|ui-serif|unset)$/
    var minifierStatus = false;
    function bindMinifier(source, key, callback) {
        if (Object.getOwnPropertyDescriptor(source, key).get) {
            return true;
        }
        var value = callback(source[key]);
        if (typeof (value) === 'string') {
            var oldValue = source[key];
            Object.defineProperty(source, key, {
                get() {
                    return minifierStatus ? oldValue : value;
                },
                set(val) {
                    value = val;
                }
            });
            return true;
        }
        return false;
    }
    function praseSelector(selector) {
        var index = 0;
        function parse(isChildren) {
            var structure = [], sentence = [];
            while (index < selector.length) {
                var _selector = selector.substr(index), match;
                for (var key = 0; key < selectorsReg.length; key++) {
                    match = _selector.match(selectorsReg[key]);
                    if (match) {
                        index += match[0].length;
                        if (/^\s*,/.test(match[0])) {
                            structure.push(sentence);
                            sentence = [];
                        } else {
                            sentence.push(match[0]);
                            if (/^:[\w\-]+\s*\(/.test(_selector)) {
                                _selector = selector.substr(index)
                                index += _selector.indexOf('(') + 1;
                                sentence.push('(', parse(true), ')');
                                if (/^\s*\)/.test(selector.substr(index))) {
                                    _selector = selector.substr(index)
                                    index += _selector.indexOf(')') + 1
                                } else if (!ignoreError) {
                                    throw new Error('伪选择器语法错误：' + selector + "\n 无法解析：" + _selector);
                                }
                            }
                        }
                        _selector = null;
                        break;
                    }
                }
                if (_selector !== null) {
                    if (isChildren) {
                        break;
                    }
                    if (ignoreError) {
                        console.info(selector, _selector);
                        var ignore = _selector.match(selectorErrorReg)[0];
                        console.info('选择器忽略：' + ignore);
                        index += ignore.length;
                        continue;
                    }
                    throw new Error('选择器语法错误：' + selector + "\n 无法解析：" + _selector);
                }
            }
            if (sentence.length) {
                structure.push(sentence);
            }
            return structure;
        }
        return parse(false);
    }
    function minifierSelector(selector, minifier) {
        function join(structure) {
            var selectors = [];
            structure.forEach(items => {
                var selector = '';
                for (var key = 0; key < items.length; key++) {
                    var str = typeof (items[key]) === 'string' ? minifier(items[key]) : join(items[key]);
                    if (str === '') {
                        return;
                    }
                    selector += str;
                }
                selectors.push(selector);
            });
            return selectors.join(',');
        }
        return join(praseSelector(selector));
    }
    function getValue(value, callback) {
        var quotes = '', important = false;
        if (/^['"]/.test(value)) {
            quotes = value[0];
            value = value.replace(/^['"]|['"]$/g, '');
        }
        if (/!important$/i.test(value)) {
            value = value.replace(/!important$/i, '');
            important = true;
        }
        var val = callback(value);
        if (typeof (val) === 'string') {
            return quotes + val + quotes + (important ? '!important' : '');
        }
    }
    function minifierPropertyValue(property, minifier) {
        var newPropertyValues = [];
        function minifierValue(start = 2) {
            var propertyValues = [], index = 0, remove = false;
            for (var i = start; i < property.length; i++) {
                if (property[i][0] !== Token.PROPERTY_VALUE) {
                    continue;
                }
                if (/^\s*,\s*$/.test(property[i][1])) {
                    newPropertyValues.push(...propertyValues);
                    if (propertyValues.length) {
                        newPropertyValues.push(property[i]);
                    }
                    minifierValue(property, i + 1);
                    while (newPropertyValues.length && /^\s*,\s*$/.test(newPropertyValues[newPropertyValues.length - 1][1])) {
                        newPropertyValues.splice(-1, 1);
                    }
                    break;
                }
                if (remove || !minifier(property[i], index++, i, start)) {
                    remove = true;
                    propertyValues = [];
                    continue;
                }
                propertyValues.push(property[i]);
            }
            newPropertyValues.push(...propertyValues);
        }
        minifierValue();
        if (newPropertyValues.length) {
            var newProperty = property.slice(0, 2);
            return newProperty.push(...newPropertyValues), newProperty;
        }
    }
    function cssMinifier(tokens) {
        minifierStatus = true;
        for (var key = 0; key < tokens.length; key++) {
            var token = tokens[key];
            switch (token[0]) {
                case Token.RULE:
                    for (var num = 0; num < token[1].length; num++) {
                        bindMinifier(token[1][num], '1', function (source) {
                            var selector = minifierSelector(source, function (selector) {
                                if (/^[#.]/.test(selector)) {
                                    var name = identifiers(selector[0] === '.' ? 'class' : 'id', selector.substr(1));
                                    if (typeof (name) === 'string') {
                                        return selector[0] + name;
                                    }
                                    return '';
                                }
                                if (/^[a-z][\w\-]*$/i.test(selector) && !/^(from|to)$/.test(selector)) {
                                    var name = identifiers('tag', selector);
                                    if (typeof (name) === 'string') {
                                        return name;
                                    }
                                    return '';
                                }
                                return selector.replace(attrReg, function (str, name, opt, value) { // 属性选择器处理
                                    var val = identifiers(name.toLocaleLowerCase(), value.replace(/^['"]|['"]$/g, ''));
                                    if (val) {
                                        var quotes = (value.match(/^["']/) || [''])[0];
                                        return name + opt + quotes + val + quotes;
                                    }
                                    return '';
                                });
                            });
                            if (selector === '') { // 删除操作
                                token[1].splice(num, 1);
                                num--;
                            } else {
                                return selector;
                            }
                        });
                    }
                    for (var property, num = 0; num < token[2].length; num++) {
                        var remove = false;
                        property = token[2][num];
                        // 变量名处理
                        if (property[1][0] === Token.PROPERTY_NAME && varDefReg.test(property[1][1])) { // 样式属性名
                            bindMinifier(property[1], '1', function (source) {
                                var name = identifiers('var-def', source.replace(/^--/, ''));
                                if (typeof (name) === 'string') {
                                    return '--' + name;
                                } else {
                                    remove = true;
                                }
                            });
                        }
                        if (!remove) {
                            // 值处理
                            var newProperty = minifierPropertyValue(property, function (propertyValue, index, curr, start) {
                                return bindMinifier(propertyValue, '1', function (source) {
                                    if (varUseReg.test(source)) {
                                        var remove = false;
                                        var value = source.replace(varUseReg, function (str, val) {
                                            var name = identifiers('var-use', val);
                                            if (typeof (name) === 'string') {
                                                return str.replace(val, name);
                                            }
                                            remove = true;
                                            return str;
                                        });
                                        if (remove) {
                                            return;
                                        }
                                        return value;
                                    } else if (/^font-family$/i.test(property[1][1])) { // 可能会有多个
                                        return getValue(source, function (val) {
                                            if (fontGenericReg.test(val)) {
                                                return val;
                                            } else {
                                                var name = identifiers('font-use', val);
                                                if (typeof (name) === 'string') {
                                                    return name;
                                                }
                                            }
                                        });
                                    } else if (/^(-[a-z]+-)?animation-name$/i.test(property[1][1])) { // 可能会有多个
                                        return getValue(source, function (val) {
                                            var name = identifiers('keyframes-use', val);
                                            if (typeof (name) === 'string') {
                                                return name;
                                            }
                                        });
                                    } else if (/^(-[a-z]+-)?animation$/i.test(property[1][1])) { // 可能会有多个
                                        if (property.length > 3) {
                                            if (/^[\d.]+(m)?s$/i.test(property[start][1])) {
                                                if (property.length - 1 <= curr || /^\s*,\s*$/.test(property[curr + 1])) {
                                                    return getValue(source, function (val) {
                                                        var name = identifiers('keyframes-use', val);
                                                        if (typeof (name) === 'string') {
                                                            return name;
                                                        }
                                                    });
                                                }
                                            } else if (index === 0) {
                                                return getValue(source, function (val) {
                                                    var name = identifiers('keyframes-use', val);
                                                    if (typeof (name) === 'string') {
                                                        return name;
                                                    }
                                                });
                                            }

                                        }
                                    }
                                    return source;
                                });
                            });
                            if (newProperty) {
                                token[2][num] = newProperty;
                                continue;
                            }
                        }
                        // 删除样式
                        token[2].splice(num, 1);
                        num--;
                    }
                    if (token[2].length > 0) {
                        continue;
                    }
                    break;
                case Token.NESTED_BLOCK:
                    // 提取动画
                    if (/^@(-[a-z]+-)?keyframes\s+/i.test(token[1][0][1])) {
                        var remove = false;
                        bindMinifier(token[1][0], '1', function (source) {
                            var arr = source.split(/\s+/, 2);
                            var val = getValue(arr[1], function (val) {
                                var name = identifiers('keyframes-def', val);
                                if (typeof (name) === 'string') {
                                    return name;
                                }
                            });
                            if (typeof (val) === 'string') {
                                arr[1] = val;
                                return arr.join(' ');
                            }
                            remove = true;
                        });
                        if (remove) {
                            break;
                        }
                    }
                    cssMinifier(token[2]);
                    continue;
                case Token.AT_RULE_BLOCK:
                    // 提取字体
                    if (/^@font-face$/i.test(token[1][0][1])) {
                        var remove = true;
                        for (var property, num = 0; num < token[2].length; num++) {
                            property = token[2][num];
                            if (/^font-family$/i.test(property[1][1])) {
                                var newProperty = minifierPropertyValue(property, function (propertyValue) {
                                    bindMinifier(propertyValue, '1', function (source) {
                                        return getValue(source, function (val) {
                                            var name = identifiers('keyframes-def', val);
                                            if (typeof (name) === 'string') {
                                                return name;
                                            }
                                        });
                                    });
                                });
                                if (newProperty) {
                                    remove = false;
                                    token[2][num] = newProperty;
                                    continue;
                                }
                                // 删除样式
                                token[2].splice(num, 1);
                                num--;
                            }
                        }
                        if (remove) {
                            break;
                        }
                    }
                    continue;
                default:
                    continue;
            }
            tokens.splice(key, 1);
            key--;
        }
        minifierStatus = false;
        return tokens;
    }
    return cssMinifier;
}

function mangleHtmlIdentifiers(identifiers, removeAttr, sortAttributes = null) {
    var classAndIdReg = /([^\s\\]+|\\.)+/g;
    function addslashes(str) {
        return str.replace(/[:.+\[\]\\#~,()&*"']/g, '\\$&');
    }
    function htmlMinifier(tag, attrs) {
        identifiers('tag', tag);
        for (var key = 0; key < attrs.length; key++) {
            switch (attrs[key].name.toLocaleLowerCase()) {
                case 'class':
                    attrs[key].value = attrs[key].value.replace(classAndIdReg, function (str) {
                        return identifiers('class', addslashes(str)) || '';
                    });
                    break;
                case 'id':
                    attrs[key].value = attrs[key].value.replace(classAndIdReg, function (str) {
                        return identifiers('id', addslashes(str)) || '';
                    });
                    break;
            }
            if (removeAttr(attrs[key].name, attrs[key].value) || /^\s*$/.test(attrs[key].value)) {
                attrs.splice(key, 1);
                key--;
            }
        }
        if (sortAttributes) {
            sortAttributes(tag, attrs);
        }
    }
    return htmlMinifier;
}


module.exports = {
    mangleCssIdentifiers,
    mangleHtmlIdentifiers
};