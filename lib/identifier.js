/**
 * 标识符处理
 */

let namesConfig = {
    lower: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    other: '_'.split(''),
    num: '0123456789'.split(''),
};
let allConfig = [];

Object.keys(namesConfig).forEach(key => {
    allConfig = allConfig.concat(namesConfig[key])
});

namesConfig.all = allConfig;

function convertIdentifier(mapping = {}) {
    let original = Object.assign({}, mapping);
    let exists = {};
    let chars = [], listen = [], _each;
    function* each(data) {
        for (var key = 0; key < data.length; key++) {
            yield data[key];
        }
    }
    function* next(key = 0, prefix = '') {
        var ret, _each, gen;
        do {
            _each = each(listen[key]);
            while (!(gen = _each.next(), gen.done)) {
                ret = prefix + gen.value;
                if (key < listen.length - 1) {
                    yield* next(key + 1, ret);
                } else if (original[key] === undefined) {
                    yield ret
                }
            }
        } while (key == 0 && listen.push(chars));
    }
    function reset(prefixes = ['lower', 'upper', 'other'], suffixes = ['all']) {
        let leading = [];
        prefixes.forEach(key => {
            leading = leading.concat(namesConfig[key])
        })
        chars = [];
        (suffixes || prefixes).forEach(key => {
            chars = chars.concat(namesConfig[key])
        })
        listen = [leading], _each = next();
        for (var key in mapping) {
            if (original[key] === undefined) {
                delete mapping[key];
            } else {
                exists[key] = 1;
            }
        }
    }
    function set(name, value) {
        if (value === undefined) {
            do {
                value = _each.next().value;
            } while (exists[name] !== undefined);
        }
        exists[name] = 1;
        return (mapping[name] = value);
    }
    function get(name) {
        return has(name) ? mapping[name] : set(name);
    }
    function has(name) {
        return mapping[name] !== undefined
    }
    reset();
    return {
        set,
        get,
        has,
        reset
    };
}

function configConvertIdentifier(container, name) {
    if (container[name] === undefined) {
        container[name] = {};
    }
    switch (typeof (container[name])) {
        case 'function':
            container[name] = container[name](container) || {};
            break;
        case 'object':
            break;
        default:
            container[name] = {};
    }
    return convertIdentifier(container[name]);
}


function keepIdentifier(mapping = {}) {
    return {
        get: function (name) { mapping[name] = true; return name; },
        has: function (name) { return mapping[name] !== undefined; }
    };
}

function agileIdentifiers(identifiers, removeCallback) {
    return function (type, name) {
        if (type instanceof Array) {
            type = (function () {
                for (var key = 0; key < type.length; key++) {
                    if (identifiers[type[key]] !== undefined) {
                        return type[key];
                    }
                }
                return false
            })();
        }
        if (type && identifiers[type] !== undefined) {
            let identifier = identifiers[type];
            if (identifier.has(name) || !removeCallback(type, name)) {
                return identifier.get(name);
            }
        } else {
            return name;
        }
    }
}


function addslashes(str) {
    return str.replace(/[~`!@#\$%\^&*\(\)+=\{\}\[\]'":;\\\|<>\?\/,\.\*\s]/g, '\\$&');
}

module.exports = { convertIdentifier, configConvertIdentifier, keepIdentifier, agileIdentifiers, addslashes };