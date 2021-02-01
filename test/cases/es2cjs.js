let es_to_cjs = require('../../lib/impl/NollupImportExportResolver');
let CodeGenerator = require('../../lib/impl/NollupCodeGenerator');
let PluginContainer = require('../../lib/impl/PluginContainer');
let RollupConfigContainer = require('../../lib/impl/RollupConfigContainer');
let { expect } = require('../nollup');
let path = require('path');

let tests = [{
    input: 'import Hello from \'./world\';',
    output: {
        code: '',
        imports: [{
            source: './world',
            specifiers: [{
                local: 'Hello',
                imported: 'default'
            }]
        }]
    }
}, {
    input: 'import \'./styles.css\';',
    output: {
        imports: [{
            source: './styles.css',
            specifiers: []
        }]
    }
}, {
    input: 'import {member} from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'member',
                imported: 'member'
            }]
        }]
    }
}, {
    input: 'import { member } from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'member',
                imported: 'member'
            }]
        }]
    }
}, {
    input: 'import {mem1, mem2} from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'mem1',
                imported: 'mem1'
            }, {
                local: 'mem2',
                imported: 'mem2'
            }]
        }]
    }
}, {
    input: 'import {member as lol} from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'lol',
                imported: 'member'
            }]
        }]
    }
}, {
    input: 'import * as lol from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'lol',
                imported: '*'
            }]
        }]
    }
}, {
    input: 'import Hello, * as World from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'Hello',
                imported: 'default'
            }, {
                local: 'World',
                imported: '*'
            }]
        }]
    }
}, {
    input: 'export default Hello;',
    output: {
        exports: ['default'],
        code: `__e__('default', Hello);;`
    }
}, {
    input: 'export default Hello',
    output: {
        exports: ['default'],
        code: `__e__('default', Hello);`
    }
}, {
    input: 'export default 123;',
    output: {
        exports: ['default'],
        code: `__e__('default', 123);;`
    }
}, {
    input: 'export default () => {};',
    output: {
        exports: ['default'],
        code: `__e__('default', () => {});;`
    }
}, {
    input: 'export default () => {}',
    output: {
        exports: ['default'],
        code: `__e__('default', () => {});`
    }
}, {
    input: 'export default (() => {});',
    output: {
        exports: ['default'],
        code: `__e__('default', (() => {}));;`
    }
}, {
    input: 'export default(() => {});',
    output: {
        exports: ['default'],
        code: `__e__('default', (() => {}));;`
    }
}, {
    input: 'export default(() => {})',
    output: {
        exports: ['default'],
        code: `__e__('default', (() => {}));`
    }
}, {
    input: 'let hello = 123;export default function () {}export { hello }',
    output: {
        exports: ['default', 'hello'],
        code: `let hello = 123;__e__('default', function () {}); ; __e__('hello', hello);`
    }
}, {
    input: 'export default(() => {});export let hello = 123;',
    output: {
        exports: ['default', 'hello'],
        code: `__e__('default', (() => {}));;let hello = 123;; __e__('hello', hello);`
    }
}, {
    input: 'export default function(){}export let hello = 123;',
    output: {
        exports: ['default', 'hello'],
        code: `__e__('default', function(){});let hello = 123;; __e__('hello', hello);`
    }
}, {
    input: 'export let hello = 123;export let world = 456;',
    output: {
        exports: ['hello', 'world'],
        code: `let hello = 123;; __e__('hello', hello);let world = 456;; __e__('world', world);`
    }
},  {
    input: 'export default class Hello {};',
    output: {
        exports: ['default'],
        code: `class Hello {}; __e__('default', Hello);;`
    }
}, {
    input: 'export default class Hello {}',
    output: {
        exports: ['default'],
        code: `class Hello {}; __e__('default', Hello);`
    }
}, {
    input: 'export class Hello {};',
    output: {
        exports: ['Hello'],
        code: `class Hello {}; __e__('Hello', Hello);;`
    }
}, {
    input: 'export class Hello {}',
    output: {
        exports: ['Hello'],
        code: `class Hello {}; __e__('Hello', Hello);`
    }
}, {
    input: 'export function Hello () {};',
    output: {
        exports: ['Hello'],
        code: `function Hello () {}; __e__('Hello', Hello);;`
    }
}, {
    input: 'let name1 = 123, name2 = 456; export {name1, name2};',
    output: {
        exports: ['name1', 'name2'],
        code: `let name1 = 123, name2 = 456; ; __e__('name1', name1);__e__('name2', name2);`
    }
}, {
    input: 'let hello = 123, name = 456; export {hello as world, name};',
    output: {
        exports: ['world', 'name'],
        code: `let hello = 123, name = 456; ; __e__('world', hello);__e__('name', name);`
    }
}, {
    input: 'export var MyVar1 = 123;',
    output: {
        exports: ['MyVar1'],
        code: `var MyVar1 = 123;; __e__('MyVar1', MyVar1);`
    }
}, {
    input: 'export var MyVar1 = () => {}, MyVar2 = 456;',
    output: {
        exports: ['MyVar1', 'MyVar2'],
        code: `var MyVar1 = () => {}, MyVar2 = 456;; __e__('MyVar1', MyVar1);__e__('MyVar2', MyVar2);`
    }
}, {
    input: 'export var MyVar1 = () => {}, MyVar2 = 456',
    output: {
        exports: ['MyVar1', 'MyVar2'],
        code: `var MyVar1 = () => {}, MyVar2 = 456; __e__('MyVar1', MyVar1);__e__('MyVar2', MyVar2);`
    }
}, {
    input: 'export const MyVar1 = () => {}, MyVar2 = 456;',
    output: {
        exports: ['MyVar1', 'MyVar2'],
        code: `const MyVar1 = () => {}, MyVar2 = 456;; __e__('MyVar1', MyVar1);__e__('MyVar2', MyVar2);`
    }
}, {
    input: 'export { MyVar } from "./file"',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'MyVar',
                imported: 'MyVar'
            }],
            export: true
        }],
        exports: ['MyVar'],
        code: ``
    }
}, {
    input: 'export { default } from "./file";',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                local: 'default',
                imported: 'default'
            }],
            export: true
        }],
        exports: ['default'],
        code: ``
    }
}, {
    input: 'export * from "./file"',
    output: {
        imports: [{
            source: './file',
            specifiers: [{
                imported: '*'
            }],
            export: true
        }],
        exports: [],
        code: ``
    }
}, {
    input: 'import Hello from "hello";import World from "world";',
    output: {
        imports: [{
            source: 'hello',
            specifiers: [{
                local: 'Hello',
                imported: 'default'
            }]
        }, {
            source: 'world',
            specifiers: [{
                local: 'World',
                imported: 'default'
            }]
        }]
    }
}, {
    input: 'export const { foo, bar } = myvar;',
    output: {
        exports: ['foo', 'bar'],
        code: `const { foo, bar } = myvar;; __e__('foo', foo);__e__('bar', bar);`
    }
}, {
    input: 'export const { foo: hello, bar: world } = myvar;',
    output: {
        exports: ['hello', 'world'],
        code: `const { foo: hello, bar: world } = myvar;; __e__('hello', hello);__e__('world', world);`
    }
}, {
    input: 'export const { foo, bar } = myvar, hello = 123;',
    output: {
        exports: ['foo', 'bar', 'hello'],
        code: `const { foo, bar } = myvar, hello = 123;; __e__('foo', foo);__e__('bar', bar);__e__('hello', hello);`
    }
}, {
    input: 'export {};',
    output: {
        exports: [],
        code: `;`
    }
}];

describe ('es_to_cjs', () => {
    tests.forEach(test => {
        it(test.input, async () => {
             test.output = {
                code: '',
                imports: [],
                exports: [],
                dynamicImports: [],
                externalDynamicImports: [],
                ...test.output
            };

            let config = new RollupConfigContainer({ input: '', plugins: [] });
            let plugins = new PluginContainer(config, {});
            plugins.start(); 
            plugins.start();

            let res = await es_to_cjs(plugins, test.input, process.cwd() + '/__entry', new CodeGenerator());
            let to_check = {};
            for (let key in test.output) {
                to_check[key] = res[key];
            }

            to_check.code = to_check.code.trim().replace(/\s+/g, ' ');

            test.output.imports = test.output.imports.map(dep => {
                dep.source = path.resolve(process.cwd(), dep.source + (!path.extname(dep.source)? '.js' : ''));
                return dep;
            });

            try {
                expect(to_check).to.deep.equal(test.output);
            } catch (e) {
                throw new Error(`
                    Expected: ${JSON.stringify(test.output)}
                    Actual: ${JSON.stringify(to_check)}
                `)
            }
        });
    })
});

let external_tests = [{
    input: 'import jQuery from "jquery";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'jQuery',
                imported: 'default'
            }],
            external: true
        }]
    },
    config: {
        external: ['jquery']
    }
}, {
    input: 'import $ from "jquery";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: '$',
                imported: 'default'
            }],
            external: true
        }]
    },
    config: {
        external: ['jquery']
    }
}, {
    input: 'import jquery from "jquery";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'jquery',
                imported: 'default'
            }],
            external: true
        }]
    },
    config: {
        external: ['jquery'],
        output: {
            globals: {
                'jquery': '$'
            }
        }
    }
}, {
    input: 'import { max } from "Math";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'Math',
            specifiers: [{
                local: 'max',
                imported: 'max'
            }],
            external: true
        }]
    },
    config: {
        external: ['Math']
    }
},{
    input: 'import { max, min } from "Math";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'Math',
            specifiers: [{
                local: 'max',
                imported: 'max'
            }, {
                local: 'min',
                imported: 'min'
            }],
            external: true
        }]
    },
    config: {
        external: ['Math']
    }
}, {
    input: 'import $, { ajax } from "jquery";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: '$',
                imported: 'default'
            }, {
                local: 'ajax',
                imported: 'ajax'
            }],
            external: true
        }]
    },
    config: {
        external: ['jquery']
    }
}, {
    input: 'import { ajax as net } from "jquery";',
    output: {
        code: '',
        imports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'net',
                imported: 'ajax'
            }],
            external: true
        }]
    },
    config: {
        external: ['jquery'],
        output: {
            globals: {
                'jquery': '$'
            }
        }
    }
}, {
    input: 'export { ajax } from "jquery";',
    output: {
        code: ``,
        imports: [],
        exports: ['ajax'],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'ajax',
                imported: 'ajax'
            }],
            export: true,
            external: true
        }]
    },
    config: {
        external: ['jquery']
    }
}, {
    input: 'export { ajax } from "jquery";',
    output: {
        code: ``,
        imports: [],
        exports: ['ajax'],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'ajax',
                imported: 'ajax'
            }],
            export: true,
            external: true
        }]
    },
    config: {
        external: ['jquery'],
        output: {
            globals: {
                'jquery': '$'
            }
        }
    }
}, {
    input: 'export { ajax as net} from "jquery";',
    output: {
        code: ``,
        imports: [],
        exports: ['net'],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'net',
                imported: 'ajax'
            }],
            export: true,
            external: true
        }]
    },
    config: {
        external: ['jquery'],
        output: {
            globals: {
                'jquery': '$'
            }
        }
    }
}, {
    input: 'export * from "jquery";',
    output: {
        code: ``,
        imports: [],
        exports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                imported: '*'
            }],
            export: true,
            external: true
        }]
    },
    config: {
        external: ['jquery']
    }
}, {
    input: 'export * from "jquery";',
    output: {
        code: ``,
        imports: [],
        exports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                imported: '*'
            }],
            export: true,
            external: true
        }]
    },
    config: {
        external: ['jquery'],
        output: {
            globals: {
                'jquery': '$'
            }
        }
    }
}, {
    input: 'import { ajax } from "jquery";',
    output: {
        code: ``,
        imports: [],
        externalImports: [{
            source: 'jquery',
            specifiers: [{
                local: 'ajax',
                imported: 'ajax'
            }],
            external: true
        }]
    },
    config: {
        external: id => /jquery/.test(id)
    }
}, {
    input: 'import { ajax } from "some/other/dep";',
    output: {
        code: ``,
        imports: [],
        externalImports: [{
            source: 'some/other/dep',
            specifiers: [{
                local: 'ajax',
                imported: 'ajax'
            }],
            external: true
        }]
    },
    config: {
        external: id => /some\/other\/dep/.test(id)
    }
}]



describe('es_to_cs_externals (ESM)', () => {
    external_tests.forEach(test => {
        it(test.input, async () => {
            let config = new RollupConfigContainer({
                ...test.config, 
                plugins: []
            });

            config.setOutputOptions({
                ...test.config.output, 
                format: 'esm'
            });

            let plugins = new PluginContainer(config, {});
            plugins.start(); 
            plugins.start();

            let res = await es_to_cjs(plugins, test.input, process.cwd() + '/__entry', new CodeGenerator());
            let to_check = {}; 

            for (let key in test.output) {
                to_check[key] = res[key];
            }

            to_check.code = to_check.code.trim().replace(/\s+/g, ' ');

            try {
                expect(to_check).to.deep.equal(test.output);
            } catch (e) {
                throw new Error(`
                    Expected: ${JSON.stringify(test.output)}
                    Actual: ${JSON.stringify(res)}
                `)
            }
        });
    })
});

describe('misc transform issues', () => {
    it ('should not fail on null nodes', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, `
            import Hello from './World';
            let a = [1, 2, , 4];
        `,  process.cwd() + '/__entry', new CodeGenerator());
        expect(res.code.indexOf('[1, 2, , 4]') > -1).to.be.true;
    });

    it ('should properly blank two imports without semi-colons', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'import Hello from "hello"',
            'import World from "world"',
            'console.log(Hello, World)'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            '                         ',
            '                         ',
            'console.log(Hello, World)'
        ].join('\n'));
    });

    it ('should properly blank two imports on the same line', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'import Hello from "hello";import World from "world"',
            'console.log(Hello, World)'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            '                                                   ',
            'console.log(Hello, World)'
        ].join('\n'));
    });


    it ('should properly blank imports that span multiple lines', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'import {',
            '   Hello',
            '} from "hello";',
            'import {',
            '   World',
            '} from "world";',
            'console.log(Hello, World)'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            '        ',
            '        ',
            '               ',
            '        ',
            '        ',
            '               ',
            'console.log(Hello, World)'
        ].join('\n'));
    });

    it ('should properly blank export {} blocks', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'var Hello, World, Foo, Bar;',
            'export { Hello, World }',
            'export { Foo, Bar };',
            'console.log(Hello, World)'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'var Hello, World, Foo, Bar;',
            '                       ; __e__(\'Hello\', Hello);__e__(\'World\', World);',
            '                    ; __e__(\'Foo\', Foo);__e__(\'Bar\', Bar);',
            'console.log(Hello, World)'
        ].join('\n'));
    });

    it ('should properly blank export {} blocks over multiple lines with padding', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'var Hello, World, Foo, Bar;',
            'export {                   ',
            '    Hello,                 ',
            '    World                  ',
            '}                          ',
            'console.log(Hello, World)'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'var Hello, World, Foo, Bar;',
            '                           ',
            '                           ',
            '                           ',
            ' ; __e__(\'Hello\', Hello);__e__(\'World\', World);                          ',
            'console.log(Hello, World)'
        ].join('\n'));
    });
});

describe ('Export Live Bindings', () => {
    it ('should only export when export is assigned for declarations', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'export let hello;',
            'hello = 123;'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'let hello;; ',
            'hello = 123;;__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });

    it ('should work for multiple exports', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'export let hello;',
            'hello = 123;',
            'export let world;',
            'world = 456;'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'let hello;; ',
            'hello = 123;;__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            'let world;; ',
            'world = 456;;__e__(\'world\', typeof world !== \'undefined\' && world);'
        ].join('\n'));
    });

    it ('should support inline assignments', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'export let hello;',
            '(function () {})(hello || (hello = 123))'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'let hello;; ',
            '(function () {})(hello || (hello = 123));__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });

    it ('should support inline assignments 2', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'export let hello;',
            '(function () {})(hello || (hello = 123));'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'let hello;; ',
            '(function () {})(hello || (hello = 123));;__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });

    it ('should not fail when found inside shadowing function expression', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'export let hello;',
            '(function (hello) { hello = 123 })();',
            'hello = 123'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'let hello;; ',
            '(function (hello) { hello = 123 })();;__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            'hello = 123;__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });

    it ('should not fail when found inside shadowing function expression for multiple exports', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'export let hello;',
            'export let world;',
            '(function (hello) { hello = 123 })();',
            '(function (world) { world = 123 })();',
            'hello = 123',
            'world = 456'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'let hello;; ',
            'let world;; ',
            '(function (hello) { hello = 123 })();;__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            '(function (world) { world = 123 })();;__e__(\'world\', typeof world !== \'undefined\' && world);',
            'hello = 123;__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            'world = 456;__e__(\'world\', typeof world !== \'undefined\' && world);'
        ].join('\n'));
    });

    it ('should not fail when exported after shadowed function statement', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'function print (hello) { hello = 123 }',
            'export let hello;',
            'hello = 123'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'function print (hello) { hello = 123 };__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            'let hello;; ',
            'hello = 123;__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });

    it ('should not fail when exported after shadowed arrow expression', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            '(hello => { hello = 123 })();',
            'export let hello;',
            'hello = 123'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            '(hello => { hello = 123 })();;__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            'let hello;; ',
            'hello = 123;__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });

    it ('should not fail when shadowed in nested functions', async () => {
        let config = new RollupConfigContainer({ plugins: [] });
        let plugins = new PluginContainer(config, {});
        plugins.start();

        let res = await es_to_cjs(plugins, [
            'function parent (hello) {',
            '   function nested (hello) {',
            '       hello = 123;',
            '   }',
            '}',
            'export let hello;',
            'hello = 123'
        ].join('\n'), process.cwd() + '/_entry', new CodeGenerator());
        expect(res.code).to.equal([
            'function parent (hello) {',
            '   function nested (hello) {',
            '       hello = 123;',
            '   }',
            '};__e__(\'hello\', typeof hello !== \'undefined\' && hello);',
            'let hello;; ',
            'hello = 123;__e__(\'hello\', typeof hello !== \'undefined\' && hello);'
        ].join('\n'));
    });
});