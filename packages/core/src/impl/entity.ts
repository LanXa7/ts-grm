import { ModelError, PropError } from "@/error/metadata_error";
import { DV_ABSTRACT, DV_MODEL_NAME, AnyModel, Ctor, TB_INHERIT, TableOptions } from "@/schema/model";
import { EntityProp } from "./entity_prop";
import { ModelImpl, ModelOptions } from "@/impl/model_impl";
import { dedent, makeErr } from "@/error/util";
import { capitalize } from "./util";
import { AbstractEntityTable, createEntityTableClass, EntityTableCtor, JoinOperation } from "./entity_table";
import { StateError } from "@/error/common";
import { ShadowAnchor } from "./shadow_anchor";
import { DatabaseNamingStrategy } from "./strategy";
import { Mutable } from "@/utils";

export class Entity {

    readonly superEntity: Entity | undefined;

    private _phase = 0;

    private _idProp: EntityProp | undefined = undefined;

    private _declaredPropMap: ReadonlyMap<string, EntityProp> | undefined = undefined;

    private _allPropMap: ReadonlyMap<string, EntityProp> | undefined = undefined;

    private _expandedPropMap: ReadonlyMap<string, EntityProp> | undefined = undefined;

    private _uniqueConstraintArr: ReadonlyArray<ReadonlyArray<EntityProp>> | undefined = undefined;

    private _tableSettings: TableSettings;

    private _tableCtor: EntityTableCtor | undefined;

    private static _nextIdentity = 0;

    readonly identity : number;

    readonly tableIdentity: number;

    static of(model: AnyModel): Entity {
        return (model as ModelImpl<any, any, any, any, any>).toEntity()
    }

    constructor(
        readonly name: string, 
        private _idKey: string | undefined, 
        private _ctor: Ctor, 
        superModel: AnyModel | undefined,
        private _options: ModelOptions
    ) {
        if (Entity._nextIdentity >= Number.MAX_SAFE_INTEGER) {
            throw new StateError(`The application has run so long`);
        }
        if (!isValidModelName(name)) {
            throw new ModelError(
                name,
                dedent`Must follow PascalCase naming convention:
                "${CAMEL_CASE_REGEX.source}"`
            )
        }
        this.superEntity = superModel !== undefined
            ? Entity.of(superModel)
            : undefined;
        
        this._tableSettings = this._createTableSettings(_options.tableOptions);
        this.identity = ++Entity._nextIdentity;
        this.tableIdentity = this._tableSettings.sharedTable
            ? this.superEntity!.tableIdentity
            : this.identity;
    }

    get idKey(): string {
        return this.superEntity?.idKey ?? this._idKey ?? 
            makeErr("Internal bug");
    }

    get idProp(): EntityProp {
        this.resolve(1);
        return this._idProp!;
    }

    get declaredPropMap(): ReadonlyMap<string, EntityProp> {
        this.resolve(1)
        return this._declaredPropMap ?? 
            makeErr(`The declaredPropMap of ${this.name} is not initialized`);
    }

    get allPropMap(): ReadonlyMap<string, EntityProp> {
        this.resolve(1);
        return this._allPropMap ?? 
            makeErr(`The allPropMap of ${this.name} is not initialized`);
    }

    get expandedPropMap(): ReadonlyMap<string, EntityProp> {
        this.resolve(2);
        return this._expandedPropMap ?? 
            makeErr(`The expandedPropMap of ${this.name} is not initialized`);
    }

    get uniqueConstraints(): ReadonlyArray<ReadonlyArray<EntityProp>> {
        this.resolve(2);
        return this._uniqueConstraintArr ?? 
            makeErr(`The uniqueConstraintArr of ${this.name} is not initialized`);
    }

    prop(name: string): EntityProp {
        return this.expandedPropMap.get(name) ?? 
            makeErr(`There is no property "${name}" in the model "${this.name}"`);
    }

    toTableName(strategy: DatabaseNamingStrategy): string {
        return this._tableSettings.explicitName ?? (
            this._tableSettings.sharedTable 
                ? this.superEntity!.toTableName(strategy)
                : strategy.tableName(this)
        );
    }

    resolve(phase: number): this {
        const max = Math.min(Math.max(0, phase), 2);
        for (let i = this._phase + 1; i <= max; i++) {
            this._resolve(i);
        }
        return this;
    }

    private _resolve(phase: number) {
        this.superEntity?.resolve(phase);
        if (this._phase >= phase) {
            return;
        }

        const oldPhase = this._phase;
        this._phase = phase;
        try {
            switch (phase) {
                case 1:
                    this._declaredPropMap = this._createDeclaredProps();
                    this._idProp = this._findIdProp();
                    this._allPropMap = this._createAllProps();
                    this._expandedPropMap = this._expandProps();
                    break;
                case 2:
                    for (const prop of this.declaredPropMap.values()) {
                        prop.resolve(1);
                    }
                    for (const prop of this.declaredPropMap.values()) {
                        prop.resolve(2);
                    }
                    this._addExpandedReferencedTargetKeyProps();
                    this._uniqueConstraintArr = this._uniqueConstraints();
                    break;
            }
        } catch (err) {
            this._phase = oldPhase;
            throw err;
        }
    }

    private _createDeclaredProps(): ReadonlyMap<string, EntityProp> {
        const declaredPropMap = new Map<string, EntityProp>();
        const instance = new this._ctor();
        for (const propName in instance) {
            if (!isValidPropName(propName)) {
                throw new PropError(
                    this.name,
                    propName,
                    dedent `Must follow CamelCase naming convention:
                    "${CAMEL_CASE_REGEX.source}"`
                );
            }
            if (declaredPropMap.has(propName)) {
                throw new PropError(
                    this.name,
                    propName,
                    `Another model with the same name and declaring model already exists.`
                );
            }
            declaredPropMap.set(
                propName, 
                new EntityProp(this, propName, instance[propName].__data, undefined)
            );
        }
        this._collectReferenceKeyProps(declaredPropMap);
        if (this.superEntity != null) {
            const tableOptions = this._options.tableOptions;
            const idMapping = !this._tableSettings.sharedTable 
            && typeof tableOptions === "object"
            && typeof tableOptions.name === "object"
                ? tableOptions.name.idMapping
                : undefined;
            const newIdProp = (this.superEntity._idProp as any)._redirectAsIdProp(this, idMapping);
            declaredPropMap.set(newIdProp.name, newIdProp);
        }
        return declaredPropMap;
    }

    private _collectReferenceKeyProps(map: Map<string, EntityProp>) {
        const newProps: Array<EntityProp> = [];
        for (const prop of map.values()) {
            const referencedTargetKeyPropName = prop.referencedTargetKeyPropName;
            if (referencedTargetKeyPropName == null) {
                continue;
            }
            const newPropName = `${prop.name}${capitalize(referencedTargetKeyPropName)}`
            if (map.has(newPropName)) {
                throw new ModelError(
                    this.name,
                    dedent `The association "${prop.toString()}" has foreign key, 
                    so the associated id property "${newPropName}" 
                    will be defined automatically, you cannot define 
                    "${newPropName}" mannually`
                );
            }
            const referenceKeyProp = new EntityProp(this, newPropName, {
                nullity: prop.nullable 
                    ? prop.inputNonNull
                        ? "INPUT_NONNULL"
                        : "NULLABLE"
                    : "NONNULL",
                scalarType: undefined,
                props: undefined,
                targetModel: undefined,
                associationType: undefined,
                columnName: undefined,
                joinColumns: undefined,
                joinTable: undefined,
                mappedBy: undefined,
                orders: undefined,
                reference: prop.name
            }, undefined);
            (referenceKeyProp as any)._setReferenceProp(prop);
            newProps.push(referenceKeyProp);
        }
        for (const prop of newProps) {
            map.set(prop.name, prop);
        }
    }

    private _findIdProp(): EntityProp {
        const idProp = this.declaredPropMap.get(this._idKey ?? this.superEntity!.idProp.name);
        if (idProp === undefined) {
            throw new ModelError(
                this.name,
                dedent`Specify the name of the id attribute as "${this._idKey}", 
                but there is no such attribute.`
            );
        }
        return idProp;
    }

    private _createAllProps(): ReadonlyMap<string, EntityProp> {
        if (this.superEntity === undefined) {
            return this.declaredPropMap;
        }
        const allPropMap = new Map<string, EntityProp>(this.superEntity.allPropMap);
        for (const prop of this.declaredPropMap.values()) {
            if (!prop.isOverride) {
                const superProp = this.superEntity.allPropMap.get(prop.name);
                if (superProp !== undefined) {
                    throw new PropError(
                        this.name,
                        prop.name,
                        dedent`A property with the same name has 
                        already been defined in super-entity "${this.superEntity.name}"`
                    );
                }
            }
            allPropMap.set(prop.name, prop);
        }
        return allPropMap;
    }

    private _expandProps(): ReadonlyMap<string, EntityProp> {
        let expendedPropMap: Map<string, EntityProp> | undefined = undefined;
        for (const prop of this.allPropMap.values()) {
            if (prop.props !== undefined) {
                expendedPropMap = new Map<string, EntityProp>(this.allPropMap);
            }
            prop.collectDeeperProps(expendedPropMap!);
        }
        return expendedPropMap !== undefined ? expendedPropMap : new Map(this.allPropMap);
    }

    private _addExpandedReferencedTargetKeyProps() {
        for (const prop of this.allPropMap.values()) {
            if (prop.associationType != null) {
                continue;
            }
            const targetKeyProp = prop.targetKeyProp;
            if (targetKeyProp != null && targetKeyProp.props !== undefined) {
                const map = new Map<string, EntityProp>();
                targetKeyProp.collectDeeperProps(map);
                const offset = targetKeyProp.name.length;
                for (const [key, value] of map.entries()) {
                    const newKey = `${prop.name}${key.substring(offset)}`;
                    (this._expandedPropMap as Map<string, EntityProp>).set(newKey, value);
                }
            }
        }
    }

    private _uniqueConstraints(): ReadonlyArray<ReadonlyArray<EntityProp>> {
        const constraints: Array<ReadonlyArray<EntityProp>> = [];
        for (const constraint of this._options.uniqueConstraints) {
            const props: Array<EntityProp> = [];
            for (const propPath of constraint) {
                const prop = this._expandedPropMap?.get(propPath);
                if (prop == null) {
                    throw new ModelError(
                        this.name, 
                        `Illegal property path "${
                            propPath
                        }" in unique constraint, it does not exists`
                    );
                }
                if (prop.referenceProp != null) {
                    throw new ModelError(
                        this.name, 
                        `Illegal property path "${
                            propPath
                        }" in unique constraint, it cannot be associated key, please use "${
                            prop.referenceProp.name
                        }"`
                    );
                }
                if (prop.scalarType == null && prop.referenceKeyProp == null) {
                    throw new ModelError(
                        this.name, 
                        `Illegal property path "${
                            propPath
                        }" in unique constraint, it is neither scalar nor reference based on foreign key`
                    );
                }
                props.push(prop);
            }
            constraints.push(props);
        }
        return constraints;
    }

    table(options: JoinOperation | ShadowAnchor | undefined): AbstractEntityTable {
        return new (this._tableClass())(this, options);
    }

    private _tableClass(): EntityTableCtor {
        let ctor = this._tableCtor;
        if (ctor == null) {
            this._tableCtor = ctor = createEntityTableClass(this);
        }
        return ctor;
    }

    toJSON(): any {
        return {
            entity: true,
            name: this.name
        }
    }

    private _createTableSettings(
        options: TableOptions<AnyModel | never> | undefined
    ): TableSettings {

        if (this.superEntity != null) {
            if (this.superEntity._tableSettings.discriminator == null) {
                throw new ModelError(
                    this.superEntity.name,
                    dedent `the "discriminator" of table options must be specified 
                    because there is a derived model "${this.name}"`  
                );
            }
            if (typeof options !== "object") {
                throw new ModelError(
                    this.name,
                    dedent `the table options must be specified as object
                    because there is a super model "${this.superEntity.name}"`  
                );
            }
        }
        
        const settings: Mutable<TableSettings> = {
            superSettings: this.superEntity?._tableSettings,
            explicitName: undefined,
            sharedTable: false,
            discriminatorValue: undefined,
            discriminator: undefined
        };
        if (options == null) {
            return settings;
        }
        if (typeof options === "string") {
            settings.explicitName = options != "" ? options : undefined;
            return settings;
        }

        if (options.name != null) {
            if (options.name === TB_INHERIT) {
                settings.sharedTable = true;
            } else {
                settings.explicitName = 
                    typeof options.name === "string"
                        ? options.name != "" ? options.name : undefined
                        : options.name.value != "" ? options.name.value : undefined;
            }
        }
        if (options.discriminator != null) {
            const type = typeof options.discriminator === "string"
                ? "string"
                : options.discriminator.type ?? "string";
            if (this.superEntity != null && type !== this.superEntity._tableSettings.discriminator!.type) {
                throw new ModelError(
                    this.name,
                    dedent `the "discriminator.type" of table options must be specified 
                    as "${type}" but the "discriminator.type" of the super model 
                    "${this.superEntity.name}" is 
                    "${this.superEntity._tableSettings.discriminator?.type}".`  
                );
            }
            let name = typeof options.discriminator === "string"
                ? options.discriminator
                : options.discriminator.name;
            if (name == null || name === "") {
                if (this.superEntity == null) {
                    throw new ModelError(
                        this.name,
                        dedent `the "discriminator.name" of table options must be specified 
                        as non-empty text because there is super model".`  
                    );
                }
                name = this.superEntity._tableSettings.discriminator!.name;
            }
            settings.discriminator = { name, type };
        } else if (this.superEntity != null) {
            settings.discriminator = this.superEntity._tableSettings.discriminator;
        }

        if (settings.discriminator != null) {
            let discriminatorValue = typeof options === "string"
                ? null
                : options?.discriminatorValue;
            if (discriminatorValue == null || discriminatorValue === "") {
                throw new ModelError(
                    this.name,
                    dedent `the "discriminatorValue" of table options must be specified 
                    because the current model requires polymorphism". 
                    Even if the model is intended to be abstract, 
                    it must be explicitly specified using the imported constant from
                    "import { DV_ABSTRACT } from '@ts-grm/core'";`  
                );
            }
            if (discriminatorValue !== DV_ABSTRACT) {
                if (discriminatorValue === DV_MODEL_NAME) {
                    discriminatorValue = this.name;
                }
                if (typeof discriminatorValue !== settings.discriminator.type) {
                    throw new ModelError(
                        this.name,
                        dedent `the "discriminatorValue" of table options is specified 
                        as ${
                            typeof discriminatorValue === "string"
                                ? `"${discriminatorValue}"`
                                : discriminatorValue
                        } but the "discriminator.type" is "${settings.discriminator.type}"`  
                    );
                }
                settings.discriminatorValue = discriminatorValue;
            }
        }
        return settings;
    }
}

export type TableSettings = {
    readonly superSettings: TableSettings | undefined;
    readonly explicitName: string | undefined;
    readonly sharedTable: boolean;
    readonly discriminator: {
        readonly name: string;
        readonly type: "string" | "number"
    } | undefined;
    readonly discriminatorValue: string | number | undefined;
};

const PASCAL_CASE_REGEX = /^[A-Z][A-Za-z\d]*$/;
function isValidModelName(name: string): boolean {
  return typeof name === 'string' && 
         name.length > 0 && 
         PASCAL_CASE_REGEX.test(name);
}

const CAMEL_CASE_REGEX = /^[a-z][A-Za-z\d]*$/;
function isValidPropName(name: string): boolean {
    return typeof name === 'string' && 
         name.length > 0 && 
         CAMEL_CASE_REGEX.test(name);
}
