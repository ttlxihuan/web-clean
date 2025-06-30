/**
 * 标识符处理
 */

function convertIdentifier(mapping = {}) {
    let original = Object.assign({}, mapping);
    let exists = {};
    let leading = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    let chars = leading.concat("0123456789".split(""))
    let listen, _each;
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
    function reset() {
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
        if (identifiers[type] !== undefined) {
            let identifier = identifiers[type];
            if (identifier.has(name) || !removeCallback(type, name)) {
                return identifier.get(name);
            }
        } else {
            return name;
        }
    }
}

module.exports = { convertIdentifier, configConvertIdentifier, keepIdentifier, agileIdentifiers };