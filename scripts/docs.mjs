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
    .flatMap(
        (item) => item.children
        // .filter((child) => DOCUMENT_LIST.includes(child.name))
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
        case 'intersection':
            return obj.types.map(parseType).reverse().join(' & ');
        case 'predicate':
            return `${obj.name} is ${parseType(obj.targetType)}`;
        case 'tuple':
            return `[${obj.elements.map(parseType)}]`;
        default:
            throw new Error(`unhandled type ${obj.type}`);
    }
}

function extractPiecesFromType(obj) {
    if (obj.type === 'reference' && obj.package?.startsWith('dockview-')) {
        return obj.name;
    }
    return null;
}

function parse(data) {
    const { name, comment, flags } = data;

    let code = '';
    const pieces = [];

    switch (data.kind) {
        case ReflectionKind.Accessor: // 262144
            if (!data.getSignature) {
                return null;
            }

            const getSignature = parse(data.getSignature);
            code += getSignature.code;
            pieces.push(...getSignature.pieces);

            return {
                name,
                code,
                kind: 'accessor',
                comment: getSignature.comment,
                pieces,
            };
        case ReflectionKind.Method: // 2048
            const methodSignature = data.signatures.map((signature) =>
                parse(signature)
            );
            pieces.push(...methodSignature.flatMap((_) => _.pieces));

            code += methodSignature
                .map((signature) => signature.code)
                .join('\n');

            return {
                name,
                code,
                kind: 'method',
                comment: data.signatures[0].comment,
                pieces,
            };
        case ReflectionKind.Property: // 1024
            code += parseType(data.type);
            pieces.push(extractPiecesFromType(data.type));

            return {
                name,
                code,
                kind: 'property',
                flags,
                comment,
                pieces,
            };

        case ReflectionKind.Parameter: // 32768
            code += `${name}`;

            if (flags.isOptional) {
                code += '?';
            }
            code += ': ';

            code += parseType(data.type);
            pieces.push(extractPiecesFromType(data.type));

            return {
                name,
                code,
                pieces,
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
                        const childData = parse(child);
                        pieces.push(...childData.pieces);

                        code += `: ${childData.code}`;
                        return code;
                    })
                    .join(', ');
                code += ` }`;
            }

            if (Array.isArray(data.signatures)) {
                const signatures = data.signatures.map((signature) =>
                    parse(signature)
                );
                code += signatures
                    .map((signature) => signature.code)
                    .join(', ');
                pieces.push(...signatures.flatMap((_) => _.pieces));
            }

            return { name, code, pieces };
        case ReflectionKind.CallSignature: // 4096
            // don't care for constrcutors

            if (Array.isArray(data.typeParameter)) {
                code += `<${data.typeParameter.map((typeParameter) => {
                    let type = `${typeParameter.name}`;

                    if (typeParameter.type) {
                        type += ` extends ${parseType(typeParameter.type)}`;

                        pieces.push(extractPiecesFromType(typeParameter.type));
                    }

                    if (typeParameter.default) {
                        type += ` = ${typeParameter.default.name}`;
                        pieces.push(
                            extractPiecesFromType(typeParameter.default)
                        );
                    }

                    return type;
                })}>`;
            }

            code += '(';

            if (Array.isArray(data.parameters)) {
                const parameters = data.parameters.map((parameter) =>
                    parse(parameter)
                );
                code += `${parameters
                    .map((parameter) => parameter.code)
                    .join(', ')}`;
                pieces.push(...parameters.flatMap((_) => _.pieces));
            }

            code += '): ';

            code += parseType(data.type);
            pieces.push(extractPiecesFromType(data.type));

            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.GetSignature: // 524288
            code += parseType(data.type);
            pieces.push(extractPiecesFromType(data.type));

            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.Function: // 64
            if (data.signatures.length > 1) {
                throw new Error('unhandled');
            }
            const functionSignature = parse(data.signatures[0]);
            pieces.push(...functionSignature.pieces);

            code += functionSignature.code;
            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.Variable: // 32
            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.EnumMember: // 16
            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.Interface: // 16
            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.ConstructorSignature: // 16384
            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.Constructor: // 512
            // don't care for constrcutors
            return {
                name,
                comment,
                code,
                pieces,
            };
        case ReflectionKind.TypeAlias: // 2097152
            if (Array.isArray(data.typeParameter)) {
                code += `<${data.typeParameter.map((typeParameter) => {
                    let type = `${typeParameter.name}`;

                    if (typeParameter.type) {
                        type += ` extends ${parseType(typeParameter.type)}`;

                        pieces.push(extractPiecesFromType(typeParameter.type));
                    }

                    if (typeParameter.default) {
                        type += ` = ${typeParameter.default.name}`;
                        pieces.push(
                            extractPiecesFromType(typeParameter.default)
                        );
                    }

                    return type;
                })}>`;
            }

            code += parseType(data.type);
            pieces.push(extractPiecesFromType(data.type));

            return {
                name,
                comment,
                code,
                pieces,
            };
        default:
            throw new Error(`unhandled kind ${data.kind}`);
    }
}

function parseDeclarationMetadata(declaration) {
    switch (declaration.kind) {
        case ReflectionKind.Namespace:
            return { kind: 'namespace' };
        case ReflectionKind.Variable:
            return { kind: 'variable' };
        case ReflectionKind.Enum:
            return { kind: 'enum' };
        case ReflectionKind.Function:
            return { kind: 'function' };
        case ReflectionKind.Class:
            return { kind: 'class' };
        case ReflectionKind.Interface:
            return { kind: 'interface' };
        case ReflectionKind.TypeAlias:
            return { kind: 'typeAlias' };
        default:
            throw new Error(`unhandled declaration kind ${declaration.kind}`);
    }
}

function createDocument(declarations) {
    const documentation = {};

    for (const declaration of declarations) {
        const { children, name } = declaration;

        /**
         * 4: Namespace
         * 8: Enum
         * 64: Function
         * 128: Class
         * 256: Interface
         * 2097152: TypeAlias
         */

        const metadata = parseDeclarationMetadata(declaration);

        documentation[name] = {
            ...metadata,
            children: [],
        };

        if (!children) {
            documentation[name].metadata = parse(declaration);
        }

        if (children) {
            for (const child of children) {
                try {
                    const { flags } = child;

                    if (flags.isPrivate) {
                        continue;
                    }

                    const output = parse(child);

                    if (output) {
                        output.pieces = Array.from(new Set(output.pieces))
                            .filter(Boolean)
                            .sort();

                        documentation[name].children.push(output);
                    }
                } catch (err) {
                    console.error('error', err, JSON.stringify(child, null, 4));
                    process.exit(-1);
                }
            }
        }
    }

    return documentation;
}

const documentation = createDocument(declarations);
writeFileSync(API_OUTPUT_FILE, JSON.stringify(documentation, null, 4));
