import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { ReflectionKind } from 'typedoc';

/**
 * #region inputs
 */

// typedoc output
const TYPEDOC_OUTPUT_FILE = './generated/typedoc.output.json';
// doc output
const API_OUTPUT_FILE = './packages/docs/src/generated/api.output.json';
// declarations to document (e.g. class names, interface names)
const DOCUMENT_LIST = [
    // dockview
    'DockviewApi',
    'IDockviewReactProps',
    'DockviewPanelApi',
    // splitview
    'SplitviewApi',
    'ISplitviewReactProps',
    'SplitviewPanelApi',
    // gridview
    'GridviewApi',
    'IGridviewReactProps',
    'GridviewPanelApi',
    // paneview
    'PaneviewApi',
    'IPaneviewReactProps',
    'PaneviewPanelApi',
];

const EXPORT_REMAPPING = {
    Event: 'DockviewEvent',
    Emitter: 'DockviewEmitter',
    IDisposable: 'IDockviewDisposable',
    MutableDisposable: 'DockviewMutableDisposable',
    CompositeDisposable: 'DockviewCompositeDisposable',
};

const SKIP_DOC = ['Event'];

/**
 * #region generating Typedoc output
 */

console.log('running docs');

if (!existsSync(TYPEDOC_OUTPUT_FILE)) {
    execSync(
        `typedoc --json ${TYPEDOC_OUTPUT_FILE}`,
        (error, stdout, stderr) => {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        }
    );
}

const content = JSON.parse(readFileSync(TYPEDOC_OUTPUT_FILE));

const dockviewCore = content.children.find(
    (child) => child.name === 'dockview-core'
);
const dockview = content.children.find((child) => child.name === 'dockview');

const declarations = [dockviewCore, dockview]
    .flatMap((item) =>
        item.children.filter((child) => DOCUMENT_LIST.includes(child.name))
    )
    .filter(Boolean);

function parseTypeArguments(args) {
    if (Array.isArray(args.typeArguments)) {
        return `<${args.typeArguments.map(parseType).join(', ')}>`;
    }
    return '';
}

function parseType(obj) {
    switch (obj.type) {
        case 'union':
            return obj.types.map(parseType).reverse().join(' | ');
        case 'intrinsic':
            return obj.name;
        case 'literal':
            return `'${obj.value}'`;
        case 'reflection':
            return parse(obj.declaration).code;
        case 'reference':
            return `${obj.qualifiedName ?? obj.name}${parseTypeArguments(obj)}`;
        case 'array':
            return `${parseType(obj.elementType)}[]`;
        default:
            throw new Error(`unhandled type ${obj.type}`);
    }
}

function parse(data) {
    const { name, comment, flags } = data;

    let code = '';

    switch (data.kind) {
        case ReflectionKind.Accessor: // 262144
            const getSignature = parse(data.getSignature);
            code += getSignature.code;

            return {
                name,
                code,
                kind: 'accessor',
                comment: getSignature.comment,
            };
        case ReflectionKind.Method: // 2048
            if (data.signatures.length > 1) {
                throw new Error('unhandled');
            }

            const signature = parse(data.signatures[0]);

            code += signature.code;

            return { name, code, kind: 'method', comment: signature.comment };
        case ReflectionKind.Property: // 1024
            code += parseType(data.type);

            return { name, code, kind: 'property', flags, comment };
        case ReflectionKind.Constructor: // 512
            // don't care for constrcutors
            return null;
        case ReflectionKind.Parameter: // 32768
            code += `${name}`;

            if (flags.isOptional) {
                code += '?';
            }
            code += ': ';

            code += parseType(data.type);

            return {
                name,
                code,
            };
        case ReflectionKind.TypeLiteral: // 65536
            if (Array.isArray(data.children)) {
                code += `{ `;
                code += data.children
                    .map((child) => {
                        let code = `${child.name}`;

                        if (child.flags.isOptional) {
                            code += '?';
                        }
                        code += `: ${parse(child).code}`;
                        return code;
                    })
                    .join(', ');
                code += ` }`;
            }

            if (Array.isArray(data.signatures)) {
                code += data.signatures
                    .map((signature) => parse(signature).code)
                    .join(', ');
            }

            return { name, code };
        case ReflectionKind.CallSignature: // 4096
            // don't care for constrcutors

            if (Array.isArray(data.typeParameter)) {
                code += `<${data.typeParameter.map((typeParameter) => {
                    let type = `${typeParameter.name} extends ${parseType(
                        typeParameter.type
                    )}`;

                    if (typeParameter.default) {
                        type += ` = ${typeParameter.default.name}`;
                    }

                    return type;
                })}>`;
            }

            code += '(';

            if (Array.isArray(data.parameters)) {
                code += `${data.parameters
                    .map((parameter) => parse(parameter).code)
                    .join(', ')}`;
            }

            code += '): ';

            code += parseType(data.type);

            return {
                name,
                comment,
                code,
            };
        case ReflectionKind.GetSignature: // 524288
            code += parseType(data.type);

            return {
                name,
                comment,
                code,
            };

        default:
            throw new Error(`unhandled kind ${data.kind}`);
    }
}

function createDocument(declarations) {
    const documentation = {};

    for (const declaration of declarations) {
        const { children, name } = declaration;

        documentation[name] = [];

        for (const child of children) {
            try {
                const { flags } = child;

                if (flags.isPrivate) {
                    continue;
                }

                const output = parse(child);
                if (output) {
                    documentation[name].push(output);
                }
            } catch (err) {
                console.error('error', err, JSON.stringify(child, null, 4));
                process.exit(-1);
            }
        }
    }

    return documentation;
}

const documentation = createDocument(declarations);
writeFileSync(API_OUTPUT_FILE, JSON.stringify(documentation, null, 4));
