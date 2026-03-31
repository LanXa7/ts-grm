import { ArgumentError } from "@/error/common";
import { EntityProp } from "./entity_prop";
import { Column, DatabaseNamingStrategy, Entity, MiddleTable } from ".";
import { capitalize } from "./util";
import { makeErr } from "@/error/util";

export class AssociationEntity {

    readonly sourceProp: AssociationProp;

    readonly targetProp: AssociationProp;

    readonly sourceKeyProp: AssociationProp;

    readonly targetKeyProp: AssociationProp;

    readonly expandedProps: ReadonlyMap<string, AssociationProp>;

    constructor(
        readonly originalProp: EntityProp,
        readonly identity: number
    ) {
        if (originalProp.storageType !== "MIDDLE_TABLE") {
            throw new ArgumentError(`The argument must be entity property base on middle table`);
        }
        const sourceProp = new AssociationPropImpl(
            this,
            "source",
            originalProp.declaringEntity,
            undefined
        );
        const targetProp = new AssociationPropImpl(
            this,
            "target",
            originalProp.targetEntity!,
            undefined
        );
        const sourceKeyProp = new AssociationPropImpl(
            this,
            `source${capitalize(originalProp.thisKeyProp!.name)}`,
            undefined,
            undefined
        );
        const targetKeyProp = new AssociationPropImpl(
            this,
            `target${capitalize(originalProp.targetKeyProp!.name)}`,
            undefined,
            undefined
        );
        sourceProp.referenceKeyProp = sourceKeyProp;
        targetProp.referenceKeyProp = targetKeyProp;
        sourceKeyProp.referenceProp = sourceProp;
        targetKeyProp.referenceProp = targetProp;
        sourceKeyProp.fillProps(originalProp.thisKeyProp!);
        targetKeyProp.fillProps(originalProp.targetKeyProp!);
        const propMap = new Map<string, AssociationProp>();
        sourceProp.collectProps("", propMap);
        targetProp.collectProps("", propMap);
        sourceKeyProp.collectProps("", propMap);
        targetKeyProp.collectProps("", propMap);
        this.sourceProp = sourceProp;
        this.targetProp = targetProp;
        this.sourceKeyProp = sourceKeyProp;
        this.targetKeyProp = targetKeyProp;
        this.expandedProps = propMap;
    }

    prop(name: string): AssociationProp {
        return this.expandedProps.get(name) ?? 
            makeErr(`There is no property "${name}" in the model "${this.toString()}"`);
    }

    toTableName(
        strategy: DatabaseNamingStrategy
    ): string {
        const middleTable = this.originalProp.toStorage(strategy) as MiddleTable;
        return middleTable.name;
    }

    toString(): string {
        return `MiddleTable(${this.originalProp.toString()})`;
    }
}

export interface AssociationProp {

    readonly declaredEntity: AssociationEntity;

    readonly rootProp: AssociationProp;

    readonly parentProp: AssociationProp | undefined;
    
    readonly name: string;

    readonly subPath: string;
    
    readonly targetEntity: Entity | undefined;

    readonly referenceKeyProp: AssociationProp | undefined;

    readonly referenceProp: AssociationProp | undefined;

    readonly props: ReadonlyMap<string, AssociationProp> | undefined;

    toString(): string;

    toColumns(
        strategy: DatabaseNamingStrategy
    ): ReadonlyArray<Column> | undefined;
}

class AssociationPropImpl implements AssociationProp {

    private _columns: ReadonlyArray<Column> | undefined = undefined;

    private _columnsResolved = false;
 
    constructor(
        readonly declaredEntity: AssociationEntity,    
        readonly name: string,
        readonly targetEntity: Entity | undefined,
        readonly parentProp: AssociationProp | undefined
    ) {}
    
    get subPath(): string {
        if (this.parentProp == null) {
            return "";
        }
        const parentPath = this.parentProp.subPath;
        if (parentPath === "") {
            return this.name;
        }
        return `${parentPath}.${this.name}`;
    }

    referenceKeyProp: AssociationProp | undefined;

    referenceProp: AssociationProp | undefined;

    props: ReadonlyMap<string, AssociationProp> | undefined;

    get rootProp(): AssociationProp {
        return this.parentProp?.rootProp ?? this;
    }

    toColumns(
        strategy: DatabaseNamingStrategy
    ): ReadonlyArray<Column> | undefined {
        if (this._columnsResolved) {
            return this._columns;
        }
        this._columns = this._toColumns(strategy);
        this._columnsResolved = true;
        return this._columns;
    }

    private _toColumns(
        strategy: DatabaseNamingStrategy
    ): ReadonlyArray<Column> | undefined {
        const rootProp = this.rootProp;
        if (rootProp.referenceProp == null) {
            return undefined;
        }
        if (this.parentProp == null) {
            const middleTable = this.declaredEntity.originalProp.toStorage(strategy) as MiddleTable;
            const isSource = rootProp.referenceProp.name === "source";
            if (isSource) {
                return middleTable.toThisColumns;
            }
            return middleTable.toTargetColumns;
        }
        if (this.props == null) {
            return rootProp
                .toColumns(strategy)!
                .filter(c => c.referencedProp!.subPath === this.subPath);
        }
        const columns: Array<Column> = [];
        for (const subProp of this.props.values()) {
            columns.push(...subProp.toColumns(strategy)!);
        }
        return columns;
    }

    toString() {
        const parent = this.parentProp;
        return parent != null 
            ? `${parent.toString()}.${this.name}`
            : `${this.declaredEntity.toString()}.${this.name}`;
    }

    fillProps(entityProp: EntityProp) {
        if (entityProp.props == null) {
            return;
        }
        const subProps = new Map<string, AssociationProp>();
        for (const subEntityProp of entityProp.props.values()) {
            const subProp = new AssociationPropImpl(
                this.declaredEntity,
                subEntityProp.name,
                undefined,
                this
            );
            subProp.fillProps(subEntityProp);
            subProps.set(subProp.name, subProp);
        }
        this.props = subProps;
    }

    collectProps(prefix: string, map: Map<string, AssociationProp>) {
        const key = prefix.length === 0 ? this.name : `${prefix}.${this.name}`;
        map.set(key, this);
        if (this.props != null) {
            for (const subProp of this.props.values()) {
                (subProp as AssociationPropImpl).collectProps(key, map);
            }
        }
    }
}