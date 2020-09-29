let MagicString = require('magic-string');
let AcornParser = require('./AcornParser');
let { findChildNodes } = require('./utils');

function getArrayPatternShadows (node) {
    let shadows = [];

    for (let i = 0; i < node.elements.length; i++) {
        let el = node.elements[i];
        if (el === null) {
            continue;
        }

        if (el.type === 'ArrayPattern') {
            shadows = shadows.concat(getArrayPatternShadows(el));
        } else {
            shadows.push(el.name);
        }
    }

    return shadows;
}

function getObjectPatternShadows (node) {
    let shadows = [];

    for (let i = 0; i < node.properties.length; i++) {
        let el = node.properties[i];
        if (el === null) {
            continue;
        }

        if (el.value.type === 'ObjectPattern') {
            shadows = shadows.concat(getObjectPatternShadows(el.value));
        } else {
            shadows.push(el.value.name);
        }
    }

    return shadows;
}

function checkIdentifier (node, ancestors, shadowed, exports, output) {
    if (node.type === 'Identifier') {
        let parent = ancestors[ancestors.length - 1];
        let isImport = output.imports.find(i => i.specifiers.find(s => s.local === node.name));
        let isExport = exports.find(e => e === node.name);
        let isShadowed = shadowed.findIndex(s => s.findIndex(si => si === node.name) !== -1) !== -1;

        if (isImport || isExport) {
            // { B: A }, { A: A }, { A }, { A: B }
            if (parent.type === 'Property') {
                if (parent.value.name === node.name) {
                    if (ancestors[ancestors.length - 2].type !== 'ObjectPattern') {
                        if (!isShadowed) {
                            let prefix = isImport? '__i__' : '__lbe__';
                            output.transpiled.overwrite(parent.start, parent.end, parent.key.name + ': ' + prefix + '["' + node.name + '"]')
                        }
                    }
                }
            } else if (parent.type === 'FunctionDeclaration' ||  // TODO: No need for these?
                parent.type === 'FunctionExpression' || 
                parent.type === 'ArrowFunctionExpression' ||
                (parent.type === 'MemberExpression' && parent.object !== node && parent.computed === false)
            ) {
                // TODO: Can we also check if it's a variable declaration name (and not the value)

                // parameter
                return;
            } else {
                if (!isShadowed) {
                    let prefix = isImport? '__i__' : '__lbe__';
                    output.transpiled.overwrite(node.start, node.end, prefix + '["' + node.name + '"]')
                }

            }
        }

    }
}

function getBlockShadows (node) {
    let shadows = [];

    if (node.params) {
        shadows = shadows.concat(node.params.map(n => n.name));
    }

    let body = node.params && node.body.body? node.body.body : node.body;

    // TODO: Recursively check for shadows if inside a function, except for let/const declarations

    for (let i = 0; i < body.length; i++) {
        let childNode = body[i];
        if (childNode.type === 'VariableDeclaration') {
            if (childNode.declarations[0] && childNode.declarations[0].id.type === 'ArrayPattern') {
                shadows = shadows.concat(getArrayPatternShadows(childNode.declarations[0].id));
            } else if (childNode.declarations[0] && childNode.declarations[0].id.type === 'ObjectPattern') {
                shadows = shadows.concat(getObjectPatternShadows(childNode.declarations[0].id));
            } else {
                shadows = shadows.concat(childNode.declarations.map(n => n.id.name));
            }
        }

        if (childNode.type === 'FunctionDeclaration') {
            shadows.push(childNode.id.name);
        }
    }

    return shadows;
}

function isFunction (node) {
    return node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression';
}

function isBlock (node) {
    return node.type === 'BlockStatement';
}

function walk (context, input, output, nodes) {
    let ancestors = [];
    let shadowed = [];
    let exports = [];
    let impl;

    // First pass on top level.
    // This is important so that we can ensure we don't convert
    // export bindings before the binding itself, but we can still
    // convert export bindings that are nested inside functions.
    impl = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];

            if (!node) {
                continue;
            }

            if (
                node.type === 'ExpressionStatement' &&
                node.expression.callee &&
                node.expression.callee.name === '__e__' &&
                node.expression.arguments[1].type === 'Identifier'
            ) {
                checkIdentifier(node.expression.arguments[1], [node], shadowed, exports, output);
                exports.push(node.expression.arguments[1].name);
                continue;
            }

            checkIdentifier(node, ancestors, shadowed, exports, output);

            if (!isFunction(node)) {
                if (isBlock(node)) {
                    shadowed.push(getBlockShadows(node));
                }

                ancestors.push(node);
                impl(findChildNodes(node));
                ancestors.pop();

                if (isBlock(node)) {
                    shadowed.pop();
                }
            }
        }
    };

    impl(nodes);

    // Second pass on identifiers in second depth level
    // This could be inside functions, or even function calls with identifiers 
    // on the top level. Use depth parameter.
    impl = (nodes, insideFunction) => {
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];

            if (!node) {
                continue;
            }

            if (isFunction(node) || (insideFunction && isBlock(node))) {
                shadowed.push(getBlockShadows(node));
                ancestors.push(node);
                let body = node.params && node.body.body? node.body.body : node.body;
                impl(Array.isArray(body)? body : [body], true);
                ancestors.pop();
                shadowed.pop();
                continue;
            }

            if (insideFunction) {
                checkIdentifier(node, ancestors, shadowed, exports, output);
            }

            ancestors.push(node);
            impl(findChildNodes(node), insideFunction);
            ancestors.pop();
        }
    };

    impl(nodes, false);
}

/**
 * @method LiveBindingsResolver
 */
module.exports = function (context, input, currentpath, imports, exports) {
    let output = {
        imports,
        exports,
        transpiled: new MagicString(input)
    };

    let ast = AcornParser.parse(input);
    walk(context, input, output, ast.body);

    output.map = output.transpiled.generateMap({ source: currentpath });
    output.code = output.transpiled.toString();
    return output;
}