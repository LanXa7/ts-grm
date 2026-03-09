import { AssociationType, JoinColumnData, Prop, PropData, ScalarType } from "@/schema/prop";
import { Entity } from "./entity";
import { PropError } from "@/error/metadata_error";
import { ModelImpl } from "./model_impl";
import { dedent, makeErr } from "@/error/util";
import { EntityPropOrder } from "./entity_prop_order";
import { StateError } from "@/error/common";
import { DatabaseNamingStrategy, joinColumnArr } from "./strategy";
import { Column, Columns, MiddleTable, PropStorage, StorageType } from "./storage";

export class EntityProp {

    readonly nullable: boolean;

    readonly inputNonNull: boolean;

    private _scalarType: ScalarType | undefined = undefined;

    readonly associationType: AssociationType | undefined = undefined;

    private _span: number | undefined = undefined;

    private _props: ReadonlyMap<string, EntityProp> | undefined = undefined;

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

    private _strategy: DatabaseNamingStrategy | undefined = undefined;

    private _storage: PropStorage | undefined = undefined;

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
                this.raise `The associatied model must be specified`
            }
            this._targetEntity = targetModel.toUnresolvedEntity();
        } else {
            this._targetEntity = undefined;
        }
        this._thisKeyProp = undefined;
        this._targetKeyProp = undefined;
    }

    get scalarType(): ScalarType | undefined {
        return this._scalarType;
    }

    get props(): ReadonlyMap<string, EntityProp> | undefined {
        return this._props;
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
            return this._data.joinColumns?.referencedProp ?? this._targetEntity?.idKey;
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

    get thisKey(): string | undefined {
        const key = this._data.joinTable?.joinThis?.referencedProp;
        if (key != null) {
            return key;
        }
        return this.declaringEntity?.idKey;
    }

    get targetKey(): string | undefined {
        let key = this._data.joinColumns?.referencedProp;
        if (key != null) {
            return key;
        }
        key = this._data.joinTable?.joinThis?.referencedProp;
        if (key != null) {
            return key;
        }
        this.resolve(2);
        return this.targetEntity?.idKey;
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
        if (this._data.mappedBy == null) {
            return;
        }
        const prop = this._targetEntity?.expandedPropMap.get(this._data.mappedBy);
        if (prop == null) {
            throw this.raise `Illegal mappedBy "${this._data.mappedBy}" 
            which deos not exists in target model ${this._targetEntity?.name}`
        }
        if (prop._targetEntity !== this.declaringEntity) {
            this.raise `Illegal mappedBy property 
            "${prop?.declaringEntity.name}.${prop?.name}", 
            its target model is not this model`
        }
        // TODO 
        this._mappedByProp = prop;
        this._oppositeProp = prop;
        prop!._oppositeProp = this;
    }

    private _resolveTarget(phase: number) {
        this._targetEntity?.resolve(phase);
    }

    private _resolveTargetKeyProps() {
        if (this._data.mappedBy != null) {
            return;
        }
        if (this._referenceProp != null) {
            this._referenceProp._resolveTargetKeyProps();
            this._targetKeyProp = this.referenceProp!._targetKeyProp;
            return;
        }
        const joinTable = this._data.joinTable;
        const joinColumns = this._data.joinColumns;
        if (joinTable != null || this.associationType === "MANY_TO_MANY") {
            if (joinTable?.joinThis?.referencedProp != null) {
                this._thisKeyProp = this.declaringEntity.prop(joinTable.joinThis.referencedProp);
            } else {
                this._thisKeyProp = this.declaringEntity.idProp;
            }
            if (joinTable?.joinTarget?.referencedProp != null) {
                this._targetKeyProp = this.targetEntity!.prop(joinTable.joinTarget.referencedProp);
            } else {
                this._targetKeyProp = this.targetEntity!.idProp;
            }
        } else if (joinColumns != null || this.associationType === "ONE_TO_ONE" || this.associationType == "MANY_TO_ONE") {
            if (joinColumns?.referencedProp) {
                this._targetKeyProp = this.targetEntity!.prop(joinColumns.referencedProp);
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

    collectDeeperProps(map: Map<string, EntityProp>) {
        this._collectDeeperProps(undefined, map);
    }

    private _collectDeeperProps(prefix: string | undefined, map: Map<string, EntityProp>) {
        if (prefix != null) {
            map.set(`${prefix}.${this.name}`, this);
        }
        if (this.props != null) {
            for (const prop of this.props.values()) {
                prop._collectDeeperProps(
                    prefix == null ? this.name : `${prefix}.${this.name}`,
                    map
                );
            }
        }
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
        if (this.parentProp != null) {
            throw new PropError(
                this.parentProp.declaringEntity.name,
                `this.parentProp.name.${this.name}`,
                dedent(strings, ...values)
            );
        }
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

    get storageType(): StorageType {
        let storageType = this._storageType;
        if (storageType == null) {
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
            this._storageType = storageType;
        }
        return storageType;
    }

    toStorage(strategy: DatabaseNamingStrategy): PropStorage | undefined {
        if (this._strategy === strategy) {
            return this._storage;
        }
        if (this._data.mappedBy != null) {
            const mappedBy = this.oppositeProp;
            const mappedByStorage = mappedBy!.toStorage(strategy);
            if (mappedByStorage == null || mappedByStorage.kind !== "MIDDLE_TABLE") {
                this._storage = undefined;
            } else {
                this._storage = {
                    ...mappedByStorage,
                    toThisColumns: mappedByStorage.toTargetColumns,
                    toTargetColumns: mappedByStorage.toThisColumns
                };
            };
        } else if (this.referenceKeyProp != null) {
            this._storage = this.referenceKeyProp.toStorage(strategy);
        } else {
            const baseStorage = this._getBaseStorage();
            if (baseStorage != null) {
                this._storage = this._createStorage(baseStorage, strategy);
            }
        }
        this._strategy = strategy;
        return this._storage;
    }

    private _createStorage(
        baseStorage: PropStorage, 
        strategy: DatabaseNamingStrategy
    ): PropStorage | undefined {
        if (baseStorage.kind === "COLUMN" && baseStorage.name === "") {
            return {
                ...baseStorage,
                name: strategy.columnName(this)
            };
        }
        if (baseStorage.kind === "COLUMNS" && this.referenceKeyProp == null && this.referenceProp == null) {
            const baseColumns = baseStorage as Columns;
            const columns: Array<Column> = [];
            let index = 0;
            for (const prop of this._props!.values()) {
                if (baseColumns[index]!.name !== "") {
                    columns.push(baseColumns[index]!);
                } else {
                    columns.push({
                        ...baseColumns[index]!,
                        name: strategy.columnName(prop)
                    });
                }
                index++;
            }
            (columns as any).kind = "COLUMNS";
            return columns as any as Columns;
        }
        if (baseStorage.kind === "MIDDLE_TABLE") {
            if (baseStorage.name === "" ||
                baseStorage.toThisColumns[0]!.name === "" && 
                baseStorage.toTargetColumns[0]!.name === ""
            ) {
                let middleTableName = baseStorage.name;
                if (middleTableName === "") {
                    middleTableName = strategy.middleTableName(this);
                }
                const toThisColumns = joinColumnArr(
                    baseStorage.toThisColumns, 
                    () => strategy.middleTableThisRefColumnName(this)
                );
                const toTargetColumns = joinColumnArr(
                    baseStorage.toTargetColumns, 
                    () => strategy.middleTableTargetRefColumnName(this)
                );
                return {
                    kind: "MIDDLE_TABLE",
                    name: middleTableName,
                    toThisColumns,
                    toTargetColumns
                }
            }
        }
        return baseStorage;
    }

    private _getBaseStorage(): PropStorage | undefined {
        let baseStrogage = this._baseStorage;
        if (baseStrogage === undefined) {
            baseStrogage = this._createBaseStorage();
            this._baseStorage = baseStrogage ?? null;
        }
        return baseStrogage !== null ? baseStrogage : undefined;
    }

    private _createBaseStorage(): PropStorage | undefined {
        if (this.scalarType != null) {
            return {
                kind: "COLUMN",
                name: this._data.columnName ?? "",
                referencedSubProp: undefined
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
                if (Array.isArray(subStorage)) {
                    columns.push(...subStorage);
                } else {
                    columns.push(subStorage as Column);
                }
            }
        }
        (columns as any).kind = "COLUMNS";
        return columns as any as Columns;
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
                referencedSubProp: undefined
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
                referencedSubProp: undefined
            };
            columns.push(column);
            return;
        }

        const propMap = new Map<string, EntityProp>();
        EntityProp._flatProps(targetKeyProp, undefined, propMap);
        const joinColumnMap = new Map<string, JoinColumnData>();
        for (const joinColumn of joinColumns) {
            if (joinColumn.columnName === "") {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The columName of each element of "${joinColumnsName}" must be specified when the foreign key has multiple-columns`
                );
            }
            if (joinColumn.referencedSubPath == null) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The referencedSubPath of each element of "${joinColumnsName}" must be specified when the foreign key has multiple-columns`
                );
            }
            if (!propMap.has(joinColumn.referencedSubPath)) {
                throw new PropError(
                    this.declaringEntity.name,
                    this.name,
                    `The referencedSubPath "${joinColumn.referencedSubPath}" of "${joinColumnsName}" is illegal`
                );
            }
            joinColumnMap.set(joinColumn.referencedSubPath, joinColumn);
        }
        for (const [k, prop] of propMap.entries()) {
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
                referencedSubProp: prop
            };
            columns.push(column);
        }
    }

    private static _flatProps(
        prop: EntityProp,
        prefix: string | undefined, 
        outputPropMap: Map<string, EntityProp>
    ) {
        if (prop.scalarType != null) {
            outputPropMap.set(`${prefix}${prop.name}`, prop);
        } else if (prop.props != null) {
            const subPrefix = prefix == null ? "" : `${prefix}${prop.name}.`;
            for (const subProp of prop.props.values()) {
                EntityProp._flatProps(subProp, subPrefix, outputPropMap);
            }
        }
    }
}
