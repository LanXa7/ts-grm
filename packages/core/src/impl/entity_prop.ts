import { AssociationType, JoinColumnData, Prop, PropData, ScalarType } from "@/schema/prop";
import { Entity } from "./entity";
import { PropError } from "@/error/metadata_error";
import { ModelImpl } from "./model_impl";
import { dedent, makeErr } from "@/error/util";
import { EntityPropOrder } from "./entity_prop_order";
import { StateError } from "@/error/common";
import { DatabaseNamingStrategy, isIllegal, fixColumn, fixColumnArr, notEmpty } from "./strategy";
import { Column, Columns, MiddelEntity, MiddleTable, PropStorage, StorageType } from "./storage";

export class EntityProp {

    readonly nullable: boolean;

    readonly inputNonNull: boolean;

    private _rootProp: EntityProp | undefined = undefined;

    private _scalarType: ScalarType | undefined = undefined;

    readonly associationType: AssociationType | undefined = undefined;

    private _span: number | undefined = undefined;

    private _props: ReadonlyMap<string, EntityProp> | undefined = undefined;

    private _flattenProps: ReadonlyMap<string, EntityProp> | undefined = undefined;

    private _flattenScalarProps: ReadonlyMap<string, EntityProp> | undefined = undefined;

    private _targetEntity: Entity | undefined = undefined;

    private _orders:  ReadonlyArray<EntityPropOrder> | undefined = undefined;

    private _mappedByProp: EntityProp | undefined = undefined;

    private _oppositeProp: EntityProp | undefined = undefined;

    private _phase = 0;

    private _thisKeyProp: EntityProp | undefined = undefined;

    private _targetKeyProp: EntityProp | undefined = undefined;

    private _referenceKeyProp: EntityProp | undefined = undefined;

    private _referenceProp: EntityProp | undefined = undefined;

    private _storageType: StorageType | undefined = undefined;

    private _baseStorage: PropStorage | null | undefined = undefined;

    private _storageResolver: DatabaseNamingStrategy | undefined = undefined;

    private _storage: PropStorage | undefined = undefined;

    private _override = false;

    private _scalarIndex: number | undefined = undefined;

    private _middleEntity: MiddelEntity | undefined = undefined;

    private _middleEntityResolved = false;

    private static readonly _EMPTY_PROP_MAP: ReadonlyMap<string, EntityProp> = 
        new Map<string, EntityProp>();

    constructor(
        readonly declaringEntity: Entity,
        readonly name: string,
        private readonly _data: PropData,
        readonly parentProp: EntityProp | undefined
    ) {
        this.validateData();
        this.nullable = _data.nullity !== "NONNULL";
        this.inputNonNull = _data.nullity != "NULLABLE";   
        this._scalarType = _data.scalarType; 
        this.associationType = _data.associationType;
        if (_data.props != null) {
            this._props = this._createProps(_data.props);
        } else {
            this._props = undefined;
        }
        if (_data.targetModel != null) {
            const targetModel: ModelImpl<any, any, any, any, any> =
                typeof _data.targetModel === "function"
                    ? _data.targetModel() as ModelImpl<any, any, any, any, any>
                    : _data.targetModel as ModelImpl<any, any, any, any, any>;
            if (targetModel == null) {
                this.raise `The associated model must be specified`
            }
            this._targetEntity = targetModel.toUnresolvedEntity();
        } else {
            this._targetEntity = undefined;
        }
        this._thisKeyProp = undefined;
        this._targetKeyProp = undefined;
    }

    get isEntityProp(): true {
        return true;
    }

    get isMiddleTableProp(): false {
        return false;
    }

    get rootProp(): EntityProp {
        let rootProp = this._rootProp;
        if (rootProp == null) {
            this._rootProp = rootProp = this.parentProp?.rootProp ?? this;
        }
        return rootProp;
    }

    get scalarType(): ScalarType | undefined {
        return this._scalarType;
    }

    get props(): ReadonlyMap<string, EntityProp> | undefined {
        return this._props;
    }

    get flattenProps(): ReadonlyMap<string, EntityProp> {
        let flattenProps = this._flattenProps;
        if (flattenProps == null) {
            if (this.props == null) {
                this._flattenProps = flattenProps = EntityProp._EMPTY_PROP_MAP;
            } else {
                const map = new Map<string, EntityProp>();
                EntityProp._collectFlattenProps(this, undefined, map);
                this._flattenProps = flattenProps = map;
            }
        }
        return flattenProps;
    }

    get flattenScalarProps(): ReadonlyMap<string, EntityProp> {
        let flattenScalarProps = this._flattenScalarProps;
        if (flattenScalarProps == null) {
            if (this.props == null) {
                this._flattenScalarProps = flattenScalarProps = EntityProp._EMPTY_PROP_MAP;
            } else {
                const map = new Map<string, EntityProp>();
                for (const [key, value] of this.flattenProps.entries()) {
                    if (value.scalarType != null) {
                        map.set(key, value);
                    }
                }
                this._flattenScalarProps = flattenScalarProps = map;
            }
        }
        return flattenScalarProps;
    }

    get scalarIndex(): number {
        let scalarIndex = this._scalarIndex;
        if (scalarIndex != null) {
            return scalarIndex;
        }
        if (this.scalarType == null) {
            scalarIndex = -1;
        } else {
            scalarIndex = 0;
            for (const prop of this.rootProp.flattenScalarProps.values()) {
                if (this == prop) {
                    break;
                }
                scalarIndex++;
            }
        }
        return this._scalarIndex = scalarIndex;
    }

    get targetEntity(): Entity | undefined {
        return this._targetEntity?.resolve(2);
    }

    get mappedByProp(): EntityProp | undefined {
        this.declaringEntity.resolve(2);
        return this._mappedByProp;
    }

    get oppositeProp(): EntityProp | undefined {
        this.declaringEntity.resolve(2);
        return this._oppositeProp;
    }

    get orders(): ReadonlyArray<EntityPropOrder> {
        this.declaringEntity.resolve(2);
        return this._orders ?? 
            makeErr(`The orders of ${this.declaringEntity.name}.${this.name} 
                is not initialized`);
    }

    get referenceKeyProp(): EntityProp | undefined {
        return this._referenceKeyProp;
    }

    get referenceProp(): EntityProp | undefined {
        return this._referenceProp;
    }

    get referencedTargetKeyPropName(): string | undefined {
        if (this._data.mappedBy != null) {
            return undefined;
        }
        if (this.associationType === "MANY_TO_ONE" || this.associationType === "ONE_TO_ONE") {
            return this._data.joinColumns?.keyProp ?? this._targetEntity?.idKey;
        }
    }

    get span(): number {
        let span = this._span;
        if (span == null) {
            this._span = span = this._calcSpan();
        }
        return span;
    }

    private _calcSpan(): number {
        if (this.associationType != null) {
            return 0;
        }
        if (this.thisKeyProp == null && this.targetKeyProp != null) {
            return this.targetKeyProp.span;
        }
        if (this._props != null) {
            let span = 0;
            for (const subProp of this._props.values()) {
                span += subProp.span;
            }
            return span;
        }
        if (this._scalarType != null) {
            return 1;
        }
        return 0;
    }

    get isRecursive(): boolean {
        for (let targetEntity = this.targetEntity; targetEntity != null; targetEntity = targetEntity.superEntity) {
            if (targetEntity === this.declaringEntity) {
                return true;
            }
        }
        return false;
    }

    get thisKeyProp(): EntityProp | undefined {
        this.resolve(2);
        return this._thisKeyProp;
    }

    get targetKeyProp(): EntityProp | undefined {
        this.resolve(2);
        return this._targetKeyProp;
    }

    private validateData() {
        if (this._data!.associationType == null) {
            this.validateSimpleData();
        } else {
            this.validateAssociationData();
        }
    }

    private validateSimpleData() {
        const data = this._data;
        if (data.joinColumns != null) {
            this.raise `The "joinColumns" cannot be specified for non-association property.`;
        }
        if (data.joinTable != null) {
            this.raise `The "joinTable" cannot be specified for non-association property.`;
        }
        if (data.orders != null) {
            this.raise `The "orders" cannot be specified for non-association property.`;
        }
        if (data.targetModel != null) {
            this.raise `The "targetModel" cannot be specified for non-association property.`;
        }
        if (data.mappedBy != null) {
            this.raise `The "mappedBy" cannot be specified for non-association property.`;
        }
        if (data.scalarType == null && data.props == null && data.reference == null) {
            this.raise `Either "scalarType", "props", or "reference" 
            must be specified for non-association property.`;
        }
        if (data.scalarType != null && data.props != null) {
            this.raise `Both "scalarType" and "props" cannot be specified 
            simultaneously for non-association property.`;
        }
    }

    private validateAssociationData() {
        const data = this._data!;
        if (data.associationType !== "ONE_TO_ONE" &&
            data.associationType !== "ONE_TO_MANY" &&
            data.associationType !== "MANY_TO_ONE" &&
            data.associationType !== "MANY_TO_MANY"
        ) {
            this.raise `The association type must be 
            "ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", or "MANY_TO_MANY".`
        }
        if (data.scalarType != null) {
            this.raise `The "scalarType" cannot be specified for association property.`;
        }
        if (data.props != null) {
            this.raise `The "props" cannot be specified for association property.`;
        }
        if (data.columnName != null) {
            this.raise `The "columnName" for association property cannot be specified; 
            please specify either joinColumns or joinTable.`;
        }
        if (data.joinColumns != null && data.joinTable != null) {
            this.raise `Both "joinColumns" and "joinTable" cannot be specified 
            simultaneously for association property.`;
        }
        if (data.joinColumns != null && data.mappedBy != null) {
            this.raise `Both "joinColumns" and "mappedBy" cannot be specified 
            simultaneously for association property.`;
        }
        if (data.joinTable != null && data.mappedBy != null) {
            this.raise `Both "joinTable" and "mappedBy" cannot be specified 
            simultaneously for association property.`;
        }
        if (data.orders != null && 
            data.associationType !== "ONE_TO_MANY" && 
            data.associationType !== "MANY_TO_MANY"
        ) {
            this.raise `"orders" can only be specified for 
            one-to-many or many-to-one property.`;
        }
    }

    resolve(phase: number) {
        const max = Math.max(Math.min(phase, 2), 0);
        for (let i = this._phase + 1; i <= max; i++) {
            this._resolve(i);
        }
    }

    private _resolve(phase: number) { 
        if (this._phase >= phase) {
            return;
        }
        if (phase === 2) {
            this._initOrders();
            this._initMappedBy();
        }
        this._resolveTarget(phase);
        if (phase === 2) {
            this._resolveTargetKeyProps();
            this._resolveReferenceKeyProp();
        }
    }

    private _initOrders() {
        if (this._data.orders == null) {
            this._orders = [];
        } else {
            const orders = new Array<EntityPropOrder>(this._data.orders.length);
            const paths = new Set<string>();
            let index = 0;
            for (const ord of this._data.orders) {
                const path = typeof ord === "string" ? ord as string : ord.path;
                const desc = typeof ord === "string" ? false : ord.desc;
                const nulls = typeof ord === "string" ? "UNSPECIFIED" : ord.nulls;
                if (paths.has(ord.path)) {
                    this.raise `Duplicated order paths "${path}"`
                }
                const prop = this._targetEntity!.expandedPropMap.get(path);
                if (prop == null) {
                    throw this.raise `Illegal order path "${path}" 
                    which deos not exists in target model ${this._targetEntity?.name}`
                }
                orders[index++] = { prop, desc, nulls };
            }
            this._orders = orders;
        }
    }

    private _initMappedBy() {
        if (this._data.mappedBy == null || this._mappedByProp != null) {
            return;
        }
        const prop = this._targetEntity?.expandedPropMap.get(this._data.mappedBy);
        if (prop == null) {
            throw this.raise `Illegal mappedBy "${this._data.mappedBy}" 
            which does not exists in target model ${this._targetEntity?.name}`
        }
        if (prop._targetEntity !== this.declaringEntity) {
            this.raise `Illegal mappedBy property 
            "${prop?.declaringEntity.name}.${prop?.name}", 
            its target model is not this model`
        }
        prop._resolve(2);
        this._mappedByProp = prop;
        this._oppositeProp = prop;
        prop!._oppositeProp = this;
    }

    private _resolveTarget(phase: number) {
        this._targetEntity?.resolve(phase);
    }

    private _resolveTargetKeyProps() {
        if (this._mappedByProp != null) {
            this._thisKeyProp = this._mappedByProp._targetKeyProp;
            this._targetKeyProp = this._mappedByProp._thisKeyProp;
            return;
        }
        if (this._referenceProp != null) {
            this._referenceProp._resolve(2);
            this._targetKeyProp = this.referenceProp!._targetKeyProp;
            return;
        }
        const joinTable = this._data.joinTable;
        const joinColumns = this._data.joinColumns;
        if (joinTable != null || this.associationType === "MANY_TO_MANY") {
            if (joinTable?.joinThis?.keyProp != null) {
                this._thisKeyProp = this.declaringEntity.prop(joinTable.joinThis.keyProp);
            } else {
                this._thisKeyProp = this.declaringEntity.idProp;
            }
            if (joinTable?.joinTarget?.keyProp != null) {
                this._targetKeyProp = this.targetEntity!.prop(joinTable.joinTarget.keyProp);
            } else {
                this._targetKeyProp = this.targetEntity!.idProp;
            }
        } else if (joinColumns != null || this.associationType === "ONE_TO_ONE" || this.associationType == "MANY_TO_ONE") {
            if (joinColumns?.keyProp) {
                this._targetKeyProp = this.targetEntity!.prop(joinColumns.keyProp);
            } else {
                this._targetKeyProp = this.targetEntity!.idProp;
            }
        }
    }

    private _resolveReferenceKeyProp() {
        const referenceProp = this._referenceProp;
        if (referenceProp == null) {
            return;
        }
        this._scalarType = referenceProp.targetKeyProp!.scalarType;
        this._props = EntityProp._redirectSubPropMap(this, referenceProp.targetKeyProp!._props);
    }

    // @ts-ignore
    private _setReferenceProp(prop: EntityProp) {
        if (this._referenceProp != null || prop._referenceKeyProp != null) {
            throw new StateError("Internal bug");
        }
        this._referenceProp = prop;
        prop._referenceKeyProp = this;
    }

    private raise(strings: TemplateStringsArray, ...values: any[]): never {
        throw new PropError(
            this.declaringEntity.name,
            this.name,
            dedent(strings, ...values)
        );
    }

    private _createProps(
        props: Record<string, Prop<any, any>>
    ): ReadonlyMap<string, EntityProp> {
        const resultMap = new Map<string, EntityProp>();
        for (const key in props) {
            const prop = props[key];
            if (prop == null) {
                continue;
            }
            if (prop.__data.associationType != null) {
                this.raise `The internal property of an embedded property 
                    cannot be association property.`;
            }
            resultMap.set(key, new EntityProp(this.declaringEntity, key, prop.__data, this));
        }
        return resultMap;
    }

    toJSON(): any {
        return {
            prop: true,
            declaringEntity: this.declaringEntity,
            name: this.name
        };
    }

    get subPath(): string {
        if (this.parentProp == null) {
            return "";
        }
        const parentSubPath = this.parentProp.subPath;
        if (parentSubPath === "") {
            return this.name;
        }
        return `${parentSubPath}.${this.name}`;
    }

    sub(subPath: string): EntityProp {
        if (subPath === "") {
            return this;
        }
        const parts = subPath.split(".");
        let prop: EntityProp = this.referenceKeyProp ?? this;
        for (const part of parts) {
            prop = prop._props?.get(part) 
                ?? makeErr(`Illegal subPath "${subPath}" for "${this.toString()}"`);
        }
        return prop;
    }

    toString(): string {
        return this.parentProp != null
            ? `${this.parentProp.toString()}.${this.name}`
            : `${this.declaringEntity.name}.${this.name}`;
    }

    private _clone(): EntityProp {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }
    
    private static _redirectSubPropMap(
        prop: EntityProp,
        propMap: ReadonlyMap<string, EntityProp> | undefined
    ) : ReadonlyMap<string, EntityProp> | undefined {
        if (propMap == null) {
            return undefined;
        }
        const newMap = new Map<string, EntityProp>();
        for (const [key, value] of propMap.entries()) {
            const newValue = value._clone();
            (newValue as any).declaringEntity = prop.declaringEntity;
            (newValue as any).parentProp = prop;
            newValue._props = EntityProp._redirectSubPropMap(newValue, newValue._props);
            newMap.set(key, newValue);
        }
        return newMap;
    }

    // @ts-ignore
    private _redirectAsIdProp(
        declaringEntity: Entity,
        idMapping: string | Record<string, string> | undefined
    ): EntityProp {
        return EntityProp._redirectIdProp(this, declaringEntity, idMapping);
    }

    private static _redirectIdProp(
        prop: EntityProp,
        declaringEntity: Entity,
        idMapping: string | Record<string, string> | undefined
    ): EntityProp {
        const newProp = prop._clone();
        newProp._override = true;
        (newProp as any).declaringEntity = declaringEntity;
        if (newProp._props == null) {
            if (idMapping != null) {
                newProp._storage = newProp._baseStorage = {
                    kind: "COLUMN",
                    name: prop.parentProp == null 
                        ? (idMapping as string) ?? ""
                        : (idMapping as Record<string, string>)[prop.subPath]
                            ?? makeErr(`The column of ${prop.toString()} must be overridden too`),
                    referencedProp: undefined,
                    referencedColumnName: undefined
                };
            }
        } else {
            const newMap = new Map<string, EntityProp>();
            const columns: Array<Column> = [];
            for (const subProp of newProp._props.values()) {
                const newSubProp = EntityProp._redirectIdProp(subProp, declaringEntity, idMapping);
                newMap.set(newSubProp.name, newSubProp);
                if (idMapping != null) {
                    const subStorage = newSubProp._baseStorage!;
                    if (subStorage.kind === "COLUMN") {
                        columns.push(subStorage);
                    } else {
                        columns.push(...subStorage as Columns);
                    }
                }
            }
            (columns as any).kind = "COLUMNS";
            newProp._storage = newProp._baseStorage = columns as any as Columns;
            newProp._props = newMap;
        }
        return newProp;
    }

    get isOverride(): boolean {
        return this._override;
    }

    get storageType(): StorageType {
        let storageType = this._storageType;
        if (storageType == null) {
            if (this.middleEntity != null) {
                storageType = "MIDDLE_ENTITY";
            } else {
                const baseStorage = this._getBaseStorage();
                if (baseStorage != null) {
                    storageType = baseStorage.kind;
                } else if (this._referenceKeyProp != null) {
                    storageType = this._referenceKeyProp._getBaseStorage()?.kind ?? "NONE";
                } else if (this._mappedByProp != null) {
                    const baseStorage = this._mappedByProp._getBaseStorage();
                    if (baseStorage?.kind === "MIDDLE_TABLE") {
                        storageType = "MIDDLE_TABLE";
                    } else {
                        storageType = "NONE";
                    }
                } else {
                    storageType = "NONE";
                }
            }
            this._storageType = storageType;
        }
        return storageType;
    }

    toStorage(strategy: DatabaseNamingStrategy): PropStorage | undefined {
        if (this._storageResolver === strategy) {
            return this._storage;
        }
        if (this._data.mappedBy != null) {
            const mappedBy = this._mappedByProp!;
            if (mappedBy._data.joinEntity != null) {
                this._storage = this.middleEntity;
            } else {
                const mappedByStorage = mappedBy.toStorage(strategy);
                if (mappedByStorage == null) {
                    this._storage = undefined;
                } else if (mappedByStorage.kind === "MIDDLE_TABLE") {
                    this._storage = {
                        ...mappedByStorage,
                        toThisColumns: mappedByStorage.toTargetColumns,
                        toTargetColumns: mappedByStorage.toThisColumns
                    };
                } else {
                    this._storage = undefined;
                }
            }
        } else if (this._data.joinEntity != null) {
            this._storage = this._getBaseStorage();
        } else if (this.referenceKeyProp != null) {
            this._storage = this.referenceKeyProp.toStorage(strategy);
        } else if (this.parentProp != null) {
            const rootColumns = this.rootProp.toStorage(strategy) as Columns;
            if (this.props == null) {
                this._storage = rootColumns[this.scalarIndex];
            } else {
                const arr: Array<Column> = [];
                for (const subProp of this.flattenScalarProps.values()) {
                    arr.push(rootColumns[subProp.scalarIndex]!);
                }
                (arr as any).kind = "COLUMNS";
                this._storage = arr as any as Columns;
            }
        } else {
            const baseStorage = this._getBaseStorage();
            if (baseStorage != null) {
                this._storage = this._createStorage(baseStorage, strategy);
            }
        }
        this._storageResolver = strategy;
        return this._storage;
    }

    private _createStorage(
        baseStorage: PropStorage, 
        strategy: DatabaseNamingStrategy
    ): PropStorage {
        if (!isIllegal(baseStorage)) {
            return baseStorage;
        }
        if (baseStorage.kind === "COLUMN") {
            return fixColumn(
                    baseStorage, 
                    () => strategy.columnName(this), 
                    () => (baseStorage.referencedProp!.toStorage(strategy) as Column).name
                );
        }
        if (baseStorage.kind === "COLUMNS") {
            let columns: ReadonlyArray<Column>;
            if (this.referenceKeyProp == null && this.referenceProp == null) {
                const arr: Array<Column> = [];
                const baseColumns = baseStorage as Columns;
                for (const prop of this._props!.values()) {
                    if (prop._props != null) {
                        const storage = prop._createStorage(prop._getBaseStorage()!, strategy);
                        if (storage.kind === "COLUMN") {
                            arr.push(storage);
                        } else {
                            arr.push(...storage as Columns);
                        }
                    } else {
                        arr.push(
                            fixColumn(
                                baseColumns[arr.length]!,
                                () => strategy.columnName(prop),
                                () => (baseColumns[arr.length]!.referencedProp?.toStorage(strategy) as Column).name
                            )
                        );
                    }
                }
                columns = arr;
            } else {
                columns = fixColumnArr(
                    baseStorage,
                    () => strategy.columnName(this),
                    c => (c.referencedProp!.toStorage(strategy) as Column).name
                );
            }
            (columns as any).kind = "COLUMNS";
            return columns as any as Columns;
        }
        if (baseStorage.kind === "MIDDLE_TABLE") {
            return {
                kind: "MIDDLE_TABLE",
                name: notEmpty(baseStorage.name, () => strategy.middleTableName(this)),
                toThisColumns: fixColumnArr(
                    baseStorage.toThisColumns,
                    () => strategy.middleTableThisRefColumnName(this), 
                    c => (c.referencedProp!.toStorage(strategy) as Column).name
                ),
                toTargetColumns: fixColumnArr(
                    baseStorage.toTargetColumns,
                    () => strategy.middleTableTargetRefColumnName(this), 
                    c => (c.referencedProp!.toStorage(strategy) as Column).name
                ),
            };
        }
        return baseStorage;
    }

    private _getBaseStorage(): PropStorage | undefined {
        let baseStorage = this._baseStorage;
        if (baseStorage === undefined) {
            baseStorage = this._createBaseStorage();
            this._baseStorage = baseStorage ?? null;
        }
        return baseStorage !== null ? baseStorage : undefined;
    }

    private _createBaseStorage(): PropStorage | undefined {
        if (this._data.joinEntity != null) {
            return this.middleEntity;
        } else if (this.scalarType != null) {
            if (this.referenceProp != null) {
                const targetKeyProp = this.referenceProp.targetKeyProp;
                return {
                    kind: "COLUMN",
                    name: this._data.columnName ?? "",
                    referencedProp: targetKeyProp,
                    referencedColumnName: (targetKeyProp?._getBaseStorage() as Column).name
                };
            }
            return {
                kind: "COLUMN",
                name: this._data.columnName ?? "",
                referencedProp: undefined,
                referencedColumnName: undefined
            };
        }
        if (this._data.mappedBy != null) {
            return undefined;
        }
        const joinTable = this._data.joinTable;
        if (joinTable != null || this.associationType === "MANY_TO_MANY") {
            const tableName = joinTable?.name ?? "";
            const toThisColumns: Array<Column> = [];
            const toTargetColumns: Array<Column> = [];
            this._collectJoinColumns(
                joinTable?.joinThis?.columns, 
                "joinTable.joinThis.columns", 
                this.thisKeyProp!, 
                toThisColumns
            );
            this._collectJoinColumns(
                joinTable?.joinTarget?.columns,
                "joinTable.joinTarget.columns",
                this.targetKeyProp!,
                toTargetColumns
            );
            const middleTable: MiddleTable = {
                kind: "MIDDLE_TABLE",
                name: tableName,
                toThisColumns,
                toTargetColumns
            };
            return middleTable;
        }
        if (this.associationType != null) {
            return undefined;
        }
        const columns: Array<Column> = [];
        const referencedTargetKeyProp = this._targetKeyProp;
        if (referencedTargetKeyProp != null) {
            this._collectJoinColumns(
                this._referenceProp!._data.joinColumns?.columns,
                "joinColumns",
                this._targetKeyProp!,
                columns
            );
            if (columns.length === 1) {
                return columns[0];
            }
        } else if (this._props != null) {
            for (const subProp of this._props.values()) {
                const subStorage = subProp._getBaseStorage() as Column | Columns;
                if (subStorage.kind === "COLUMNS") {
                    columns.push(...subStorage);
                } else {
                    columns.push(subStorage as Column);
                }
            }
        }
        (columns as any).kind = "COLUMNS";
        return columns as any as Columns;
    }

    get middleEntity(): MiddelEntity | undefined {
        if (this._middleEntityResolved) {
            return this._middleEntity;
        }
        let middleEntity: MiddelEntity | undefined;
        if (this._mappedByProp != null) {
            middleEntity = this._mappedByProp.middleEntity;
            if (middleEntity != null) {
                middleEntity = {
                    ...middleEntity,
                    joinThisProp: middleEntity.joinTargetProp,
                    joinTargetProp: middleEntity.joinThisProp
                };
            }
        } else {
            middleEntity = this._createMiddleEntity();
        }
        this._middleEntity = middleEntity;
        this._middleEntityResolved = true;
        return middleEntity;
    }

    private _createMiddleEntity(): MiddelEntity | undefined {
        const joinEntity = this._data.joinEntity;
        if (joinEntity == null) {
            return undefined;
        }
        const entity = Entity.of(joinEntity.model);
        const joinThisProp = entity.prop(joinEntity.joinThisProp);
        if (joinThisProp.targetEntity !== this.declaringEntity) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The target entity of joinThisProp "${
                    joinThisProp.toString()
                }" must be "${this.declaringEntity.name}"`
            );
        }
        const joinTargetProp = entity.prop(joinEntity.joinTargetProp);
        if (joinTargetProp.targetEntity !== this.targetEntity) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The target entity of joinTargetProp "${
                    joinThisProp.toString()
                }" must be "${this.targetEntity!.name}"`
            );
        }
        const joinThisAssociationType: AssociationType = 
            this.associationType === "ONE_TO_MANY" || this.associationType === "ONE_TO_ONE"
                ? "ONE_TO_ONE"
                : "MANY_TO_ONE";
        const joinTargetAssociationType: AssociationType = 
            this.associationType === "MANY_TO_ONE" || this.associationType === "ONE_TO_ONE"
                ? "ONE_TO_ONE"
                : "MANY_TO_ONE";
        if (joinThisProp.associationType !== joinThisAssociationType) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The association type of joinThisProp "${
                    joinThisProp.toString()
                }" must be "${joinThisAssociationType}"`
            );
        }
        if (joinTargetProp.associationType !== joinTargetAssociationType) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The association type of joinTargetProp "${
                    joinThisProp.toString()
                }" must be "${joinTargetAssociationType}"`
            );
        }
        if (joinThisProp._data.mappedBy != null) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The joinThisProp "${
                    joinThisProp.toString()
                }" cannot be inverse property(with "mappedBy")`
            );
        }
        if (joinTargetProp._data.mappedBy != null) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The joinTargetProp "${
                    joinThisProp.toString()
                }" cannot be inverse property(with "mappedBy")`
            );
        }
        return {
            kind: "MIDDLE_ENTITY",
            entity,
            joinThisProp,
            joinTargetProp
        };
    }

    private _collectJoinColumns(
        joinColumns: ReadonlyArray<JoinColumnData> | undefined,
        joinColumnsName: string,
        targetKeyProp: EntityProp,
        columns: Array<Column>
    ): void {
        if (joinColumns == null || joinColumns.length === 0) {
            if (targetKeyProp._props != null) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The "${joinColumnsName}" must be explicitly specified when the foreign key has multiple-columns`
                );
            }
            const column: Column = {
                kind: "COLUMN",
                name: "",
                referencedProp: targetKeyProp,
                referencedColumnName: (targetKeyProp._getBaseStorage() as Column).name
            };
            columns.push(column);
            return;
        }

        if (joinColumns.length !== targetKeyProp.span) {
            throw new PropError(
                this.declaringEntity.name,
                this.name,
                `The size of "${joinColumnsName}" must be ${targetKeyProp.span}`
            );
        }

        if (targetKeyProp._props == null) {
            if (joinColumns[0]!.referencedSubPath != null) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The referencedSubPath of "${joinColumnsName}[0]" cannot be specified when the foreign key is single-column`
                );
            }
            const column: Column = {
                kind: "COLUMN",
                name: "",
                referencedProp: targetKeyProp,
                referencedColumnName: (targetKeyProp._getBaseStorage() as Column).name
            };
            columns.push(column);
            return;
        }

        const joinColumnMap = new Map<string, JoinColumnData>();
        for (const joinColumn of joinColumns) {
            if (joinColumn.columnName === "") {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The columnName of each element of "${joinColumnsName}" must be specified when the foreign key has multiple-columns`
                );
            }
            if (joinColumn.referencedSubPath == null) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The referencedSubPath of each element of "${joinColumnsName}" must be specified when the foreign key has multiple-columns`
                );
            }
            if (!targetKeyProp.flattenScalarProps.has(joinColumn.referencedSubPath)) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The referencedSubPath "${joinColumn.referencedSubPath}" of "${joinColumnsName}" is illegal`
                );
            }
            joinColumnMap.set(joinColumn.referencedSubPath, joinColumn);
        }
        for (const [k, prop] of targetKeyProp.flattenScalarProps.entries()) {
            const joinColumn = joinColumnMap.get(k);
            if (joinColumn == null) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The target key sub property "${prop.toString()}" of "${joinColumnsName}" is not referenced by any join column`
                );
            }
            const column: Column = {
                kind: "COLUMN",
                name: joinColumn.columnName,
                referencedProp: prop,
                referencedColumnName: (prop._getBaseStorage() as Column).name
            };
            columns.push(column);
        }
    }

    private static _collectFlattenProps(
        prop: EntityProp,
        prefix: string | undefined, 
        outputPropMap: Map<string, EntityProp>
    ) {
        if (prefix == null) {
            outputPropMap.set("", prop);
        } else {
            outputPropMap.set(`${prefix}${prop.name}`, prop);
        }
        if (prop.props != null) {
            const subPrefix = prefix == null ? "" : `${prefix}${prop.name}.`;
            for (const subProp of prop.props.values()) {
                EntityProp._collectFlattenProps(subProp, subPrefix, outputPropMap);
            }
        }
    }
}
