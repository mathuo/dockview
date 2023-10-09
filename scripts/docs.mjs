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
/**
 * #region parsing of TypeDoc output
 */

function findType(type, packageName) {
    if (EXPORT_REMAPPING[type]) {
        type = EXPORT_REMAPPING[type];
    }

    const packageObject = content.children.find(
        (child) => child.name === packageName
    );

    const typeObject = packageObject.children.find(
        (child) => child.name === type
    );

    return getFunction(typeObject, [], { includeMetadata: false });
}

// minimal parsing logic, add cases as required
function getType(type, metadata, options) {
    switch (type.type) {
        case 'union':
            return {
                signature: [...type.types]
                    .reverse()
                    .map((t) => getType(t, metadata, options).signature)
                    .join(' | '),
            };
        case 'intrinsic':
            return { signature: type.name };
        case 'reference':
            if (
                options.includeMetadata &&
                type.package &&
                typeof type.target !== 'object'
            ) {
                metadata.push({ name: type.name, package: type.package });
            }

            if (Array.isArray(type.typeArguments)) {
                return {
                    signature: `${type.name}<${type.typeArguments
                        .map((typeArgument) => {
                            return getType(typeArgument, metadata, options)
                                .signature;
                        })
                        .join(', ')}>`,
                };
            }

            return { signature: `${type.name}` };
        case 'array':
            return {
                signature: `${
                    getType(type.elementType, metadata, options).signature
                }[]`,
            };
        case 'reflection':
            if (type.declaration.children) {
                return {
                    signature: `{ ${type.declaration.children
                        .map(
                            (child) =>
                                `${child.name}: ${
                                    getType(child.type, metadata, options)
                                        .signature
                                }`
                        )
                        .join(', ')} }`,
                };
            }

            if (type.declaration.signatures) {
                if (type.declaration.signatures.length > 1) {
                    // code this case if it ever happens
                    throw new Error(`unhandled signatures.length > 1`);
                }

                if (type.declaration.signatures[0].parameters) {
                    let _parameters = '';
                    const { parameters } = type.declaration.signatures[0];

                    for (let i = 0; i < parameters.length; i++) {
                        const { type, name, flags, defaultValue } =
                            parameters[i];

                        const isOptional = flags.isOptional === true;

                        const { signature } = getType(type, metadata, options);

                        _parameters += `${name}${
                            isOptional ? '?' : ''
                        }: ${signature}${
                            defaultValue !== undefined
                                ? ` = ${defaultValue}`
                                : ''
                        }`;

                        if (i !== parameters.length - 1) {
                            _parameters += ', ';
                        }
                    }

                    return {
                        signature: `(${_parameters}): ${
                            getType(
                                type.declaration.signatures[0].type,
                                metadata,
                                options
                            ).signature
                        }`,
                    };
                }

                return {
                    signature: getType(
                        type.declaration.signatures[0].type,
                        metadata,
                        options
                    ).signature,
                };
            }

            if (type.declaration.indexSignature) {
                let _parameters = '';
                const { parameters } = type.declaration.indexSignature;

                for (let i = 0; i < parameters.length; i++) {
                    const { type, name, flags, defaultValue } = parameters[i];

                    const isOptional = flags.isOptional === true;

                    _parameters += `${name}${isOptional ? '?' : ''}: ${
                        getType(type, metadata, options).signature
                    }${defaultValue !== undefined ? ` = ${defaultValue}` : ''}`;

                    if (i !== parameters.length - 1) {
                        _parameters += ', ';
                    }
                }

                return {
                    signature: `{ [${parameters}]: ${getType(
                        type.declaration.indexSignature.type,
                        metadata,
                        options
                    )}}`,
                };
            }

            throw new Error('unhandled case');
        case 'literal':
            return { signature: `'${type.value}'` };
        default:
            throw new Error(`unhandled type ${type.type}`);
    }
}

// minimal parsing logic, add cases as required
function getFunction(
    method,
    metadata = [],
    options = { includeMetadata: true }
) {
    switch (method.kind) {
        case ReflectionKind.Accessor: {
            const { getSignature, name } = method;
            const { type, comment } = getSignature;
            const metadata = [];
            const { signature } = getType(type, metadata, options);
            return {
                name,
                signature,
                comment,
                type: 'accessor',
                metadata: metadata.length > 0 ? metadata : undefined,
            };
        }
        case ReflectionKind.Property: {
            const { type, name, comment } = method;
            const metadata = [];
            const { signature } = getType(type, metadata, options);
            return {
                name,
                signature,
                comment,
                type: 'property',
                metadata: metadata.length > 0 ? metadata : undefined,
            };
        }
        case ReflectionKind.Interface: {
            const { type, name, comment, children } = method;

            let signature = `interface ${name} {`;

            if (children) {
                for (const child of children) {
                    signature += `\n\t${
                        child.flags.isReadonly ? 'readonly ' : ''
                    }${child.name}: ${
                        getFunction(child, metadata, options).signature
                    };`;
                }
            }
            signature += `\n}`;

            return {
                name,
                signature,
                comment,
                type: 'interface',
                metadata: metadata.length > 0 ? metadata : undefined,
            };
        }
        case ReflectionKind.Method: {
            const { signatures } = method;
            if (signatures.length > 1) {
                throw new Error(`signatures.length > 1`);
            }
            const { name, parameters, type, typeParameter, comment } =
                signatures[0];

            let _typeParameter = '';

            if (Array.isArray(typeParameter)) {
                for (let i = 0; i < typeParameter.length; i++) {
                    const item = typeParameter[i];

                    const { signature } = getType(item.type, metadata, options);

                    _typeParameter += `<${item.name}`;
                    if (item.type) {
                        _typeParameter += ` extends ${signature}`;
                    }
                    if (item.default) {
                        _typeParameter += ` = ${
                            getType(item.default, metadata, options).signature
                        }`;
                    }
                    _typeParameter += `>`;

                    if (i !== typeParameter.length - 1) {
                        _typeParameter += ', ';
                    }
                }
            }

            let _parameters = '';

            if (Array.isArray(parameters)) {
                for (let i = 0; i < parameters.length; i++) {
                    const { type, name, flags, defaultValue } = parameters[i];

                    const isOptional = flags.isOptional === true;

                    const { signature } = getType(type, metadata, options);

                    _parameters += `${name}${
                        isOptional ? '?' : ''
                    }: ${signature}${
                        defaultValue !== undefined ? ` = ${defaultValue}` : ''
                    }`;

                    if (i !== parameters.length - 1) {
                        _parameters += ', ';
                    }
                }
            }

            return {
                name,
                comment,
                signature: `${_typeParameter}(${_parameters}): ${
                    getType(type, metadata, options).signature
                }`,
                type: 'method',
                metadata: metadata.length > 0 ? metadata : undefined,
            };
        }
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

                const documentationPart = getFunction(child, [], {
                    includeMetadata: false,
                });

                if (documentationPart) {
                    if (documentationPart.metadata) {
                        documentationPart.metadata = documentationPart.metadata
                            .filter(({ name }) => !SKIP_DOC.includes(name))
                            .map((item) => {
                                return findType(item.name, item.package);
                            });
                    }

                    documentation[name].push(documentationPart);
                }
            } catch (err) {
                console.error('error', err, child);
                process.exit(-1);
            }
        }
    }

    return documentation;
}

const documentation = createDocument(declarations);
writeFileSync(API_OUTPUT_FILE, JSON.stringify(documentation, null, 4));
