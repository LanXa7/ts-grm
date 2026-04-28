import { StateError } from "@/error/common";
import { FetchProp } from "./dto";
import { DtoMapper, DtoMapperField } from "./dto_mapper";
import { EntityProp } from "./entity_prop";
import { CalculatorKind } from "@/schema/prop";

export type Shape = {
    [key: string]: ShapeMember;
} & {
    __implicit?: { [key: string]: number };
};

export type ShapeMember = 
    (number | string | undefined)
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
            shapeScope!.assign(path, buildShapeMember(field, false));
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
                    const implicitName = 
                        path[i]!.startsWith("<implicit:") && path[i]!.endsWith(">")
                            ? path[i]!.substring(10, path[i]!.length - 1)
                            : undefined;
                    let foldShape: Shape | undefined = 
                        implicitName != null
                            ? scope.implicit[implicitName] as Shape
                            : scope.shape[path[i]!] as Shape;
                    if (foldShape == null) {
                        if (implicitName != null) {
                            scope.implicit[implicitName] = foldShape = {};
                        } else {
                            scope.assign(path[i]!, foldShape = {});
                        }
                    }
                    scope = scope.fold(foldShape);
                }
            }
            shapeScope = scope;
            try {
                scope!.assign(
                    path[max]!, 
                    buildShapeMember(
                        field, 
                        isColumnIgnored(oldScope, scope)
                    )
                );
            } finally {
                shapeScope = oldScope;
            }
        }
    }
}

function buildShapeMember(
    field: DtoMapperField,
    ignoreColumnIndex: boolean
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
    if (field.prop.isEntityProp && (field.prop as EntityProp).formulaData?.kind === "TS") {
        return field.prop.name;
    }
    return field.columnIndex;
}

function isCollection(prop: FetchProp): boolean {
    return prop.associationType === "ONE_TO_MANY" 
        || prop.associationType === "MANY_TO_MANY"
        || isCalculatorKindEquals(prop, "COLLECTION");
}

function isReference(prop: FetchProp): boolean {
    return prop.associationType === "ONE_TO_ONE" 
        || prop.associationType === "MANY_TO_ONE"
        || isCalculatorKindEquals(prop, "NONNULL_REFERENCE", "NULLABLE_REFERENCE");
}

function isCalculatorKindEquals(prop: FetchProp, ...kinds: Array<CalculatorKind>): boolean {
    if (!prop.isEntityProp) {
        return false;
    }
    const kind = (prop as EntityProp).calculatorData?.kind;
    if (kind == null) {
        return false;
    }
    for (const k of kinds) {
        if (k == kind) {
            return true;
        }
    }
    return false;
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

    get implicit(): {[key: string]: ShapeMember } {
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
        if (parent._modelScope.shape[name] !== this.shape) {
            parent._modelScope.assign(name, this.shape);
        }
    }

    private _getImplicit(): {[key: string]: ShapeMember } {
        let i = this.shape.__implicit;
        if (i == null) {
            this.shape.__implicit = i = {};
        }
        return i;
    }

    assign(key: string, member: ShapeMember) {
        if (typeof this.shape[key] === "number") {
            throw new StateError(
                `Conflict mapping for "${
                    this.toString()
                }.${key}"`
            );
        }
        this.shape[key] = member;
    }

    toString(): string {
        if (this.field == null) {
            return this.mapper.entity.name;
        }
        return `${this.parent!.toString()}.${this.field.prop.name}`;
    }
};

const recursive: Shape = { __recursive: 1 };