import { FetchProp } from "./dto";
import { DtoMapper, DtoMapperField } from "./dto_mapper";

export type Shape = {
    [key: string]: ShapeMember;
} & {
    __implicit?: { [key: string]: number | { __array: Shape } };
};

export type ShapeMember = 
    (number | undefined)
    | Shape
    | { __array: Shape }
    | { __ref: Shape };

export function isEmptyShape(shape: Shape): boolean {
    const keys = Object.keys(shape);
    if (keys.length === 0) {
        return true;
    }
    return keys.length === 1 && keys[0] === "__implicit";
}

export function buildShape(
    mapper: DtoMapper
): Shape {
    return buildShapeImpl(mapper, undefined);
}

function buildShapeImpl(
    mapper: DtoMapper,
    field: DtoMapperField | undefined
): Shape {
    const shape: Shape = {};
    shapeScope = new ShapeScope(mapper, shape, shapeScope, field, undefined);
    try {
        fillShapeNode(mapper);
    } finally {
        shapeScope = shapeScope.parent;
    }
    return shape;
}

function fillShapeNode(
     mapper: DtoMapper
) {
    for (let i = 0; i < mapper.fields.length; i++) {
        const field = mapper.fields[i]!;
        if (field.paths.length === 0) {
            buildShapeMember(field, false);
            if (field.isDependent) {
                shapeScope!.implicit[`_${i}`] = field.columnIndex!;
            }
        } else {
            handleExplictField(field);
        }
    }
}

function handleExplictField(field: DtoMapperField) {
    for (const path of field.paths) {
        if (typeof path === 'string') {
            shapeScope!.shape[path] = buildShapeMember(field, false);
        } else {
            const oldScope = shapeScope!;
            let scope = oldScope;
            const max = path.length - 1;
            for (let i = 0; i < max; i++) {
                if (path[i] === "..") {
                    if (scope.parent == null) {
                        return;
                    }
                    scope = scope.parent;
                } else {
                    let foldShape = scope.shape[path[i]!] as Shape;
                    if (foldShape == null) {
                        scope.shape[path[i]!] = foldShape = {};
                    }
                    scope = scope.fold(foldShape);
                }
            }
            shapeScope = scope;
            try {
                scope!.shape[path[max]!] = buildShapeMember(
                    field, 
                    isColumnIgnored(oldScope, scope)
                );
            } finally {
                shapeScope = oldScope;
            }
        }
    }
}

function buildShapeMember(
    field: DtoMapperField,
    ignoreColumnIndex: boolean,
): ShapeMember | undefined {
    if (field.subMapper) {
        if (isCollection(field.prop)) {
            return field.recursiveDepth != null 
                ? { 
                    ...recursive,
                    __array: buildShapeImpl(field.subMapper, field)
                } : { 
                    __array: buildShapeImpl(field.subMapper, field)
                };
        } 
        if (isReference(field.prop)) {
            return field.recursiveDepth != null 
                ? {
                    ...recursive,
                    __ref: buildShapeImpl(field.subMapper, field)
                } : {
                    __ref: buildShapeImpl(field.subMapper, field)
                };
        }
        return buildShapeImpl(field.subMapper, field);
    }
    if (ignoreColumnIndex) {
        return undefined;
    }
    return field.columnIndex;
}

function isCollection(prop: FetchProp): boolean {
    return prop.associationType === "ONE_TO_MANY" 
        || prop.associationType === "MANY_TO_MANY";
}

function isReference(prop: FetchProp): boolean {
    return prop.associationType == "ONE_TO_ONE" 
        || prop.associationType == "MANY_TO_ONE";
}

function isColumnIgnored(
    oldScope: ShapeScope,
    scope: ShapeScope
) {
    if (oldScope.mapper === scope.mapper) {
        return false;
    }
    const middleEntity = scope.field?.bridgeProp?.middleEntity;
    if (middleEntity != null) {
        if (scope.parent!.mapper.entity === middleEntity.joinThisProp.targetEntity
            && oldScope.mapper.entity === middleEntity.joinTargetProp.targetEntity
        ) {
            return false;
        }
    }
    return true;
}

let shapeScope: ShapeScope | undefined = undefined;

class ShapeScope {

    private readonly _modelScope: ShapeScope;

    constructor(
        readonly mapper: DtoMapper,
        readonly shape: Shape,
        readonly parent: ShapeScope | undefined,
        readonly field: DtoMapperField | undefined,
        modelScope: ShapeScope | undefined
    ) {
        this._modelScope = modelScope ?? this;
    }

    get modelScope(): ShapeScope {
        return this._modelScope;
    }

    fold(foldShape: Shape): ShapeScope {
        return new ShapeScope(
            this.mapper,
            foldShape,
            this,
            undefined,
            this._modelScope
        );
    }

    get implicit(): {[key: string]: number | { __array: Shape }} {
        this._modelScope._reachable();
        return this._modelScope._getImplicit();   
    }

    private _reachable() {
        const parent = this.parent;
        if (parent == null) {
            return;
        }
        parent._modelScope._reachable();
        const name = this.mapper?.bridgeProp?.name ?? this.mapper.associatedProp!.name;
        if (parent._modelScope.shape[name] != this.shape) {
            parent._modelScope.shape[name] = this.shape;
        }
    }

    private _getImplicit(): {[key: string]: number | { __array: Shape } } {
        let i = this.shape.__implicit;
        if (i == null) {
            this.shape.__implicit = i = {};
        }
        return i;
    }
};

const recursive: Shape = { __recursive: 1 };