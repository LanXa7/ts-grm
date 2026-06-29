import { ArgumentError, StateError } from "@/error/common";
import { Entity } from "@/impl/entity";
import { AnyModel, Ctor, CtorMembers, Model, ModelContext, TableOptions, UniqueKeys } from "@/schema/model";
import { ModelContract } from "./model_contract";
// import { ExplicitViewArgs } from "@/schema/view";
// import { ExplicitActionKeys, RestrictKeys } from "@/schema/view/common";
// import { suppressUnused } from "@/utils";
// import { PolymorphismEntry } from "@/schema/view/polymorphism";

export class ModelImpl<
    TName extends string, 
    TIdKey extends string,
    TCtor extends Ctor,
    TAllMembers extends object,
    TSuperNames extends string | never
> implements Model<
    TName,
    TIdKey,
    TCtor,
    TAllMembers,
    TSuperNames
>, ModelContract {

    readonly identifier: number = allocateModelIdentifier();

    private _entity: Entity | undefined;

    private _derivedModels: Set<AnyModelImpl> | undefined;

    __type(): {
        model: [TName, TIdKey, TCtor, TAllMembers, TSuperNames] | true
    } {
        return { model: true };
    }

    constructor(
        readonly name: TName,
        readonly idKey: TIdKey | undefined,
        readonly ctor: TCtor,
        readonly superModel: AnyModel | undefined,
        readonly options: ModelOptions
    ) {
        if (ALL_MODEL_MAP.has(name)) {
            throw new StateError(`Duplicate models with same name: "${name}"`);
        }
        ALL_MODEL_MAP.set(name, this);
        if (superModel != null) {
            const superImpl = superModel as ModelImpl<any, any, any, any, any>;
            let derivedModels = superImpl._derivedModels;
            if (derivedModels == null) {
                superImpl._derivedModels = derivedModels = new Set();
            }
            derivedModels.add(this);
        }
    }

    // when<
    //     TSelf extends AnyModel,
    //     TDerivedModel extends AnyModel,
    //     const TViewArgs extends ExplicitViewArgs<TDerivedModel, DeclaredModelMembers<TDerivedModel>>
    // >(
    //     this: TSelf,
    //     derivedModel: DerivedModel<TDerivedModel, any>,
    //     args: RestrictKeys<TViewArgs, keyof DeclaredModelMembers<TDerivedModel> | ExplicitActionKeys>
    // ): PolymorphismEntry<TDerivedModel, TSelf, TViewArgs & {$explicit: true}> {
    //     suppressUnused(derivedModel);
    //     suppressUnused(args);
    //     throw new Error();
    // }

    toEntity(): Entity {
        return this.toUnresolvedEntity().resolve(2);
    }

    toUnresolvedEntity(): Entity {
        let entity = this._entity;
        if (entity === undefined) {
            this._entity = entity = new Entity(
                this.name,
                this.idKey,
                this.ctor,
                this,
                this.options
            );
        }
        return entity;
    }

    get derivedModels(): ReadonlySet<AnyModelImpl> | undefined {
        return this._derivedModels as any;
    }
}

export type AnyModelImpl = ModelImpl<any, any, any, any, any>;

export type ModelOptions = {
    readonly tableOptions: TableOptions<AnyModel | never> | undefined;
    readonly uniqueConstraints: ReadonlyArray<ReadonlyArray<string>>;
};

export class ModelContextImpl<TCtor extends Ctor, TSuperModel extends AnyModel | never> 
implements ModelContext<TCtor, TSuperModel> {

    private _tableOptions: TableOptions<TSuperModel> | undefined = undefined;

    private readonly _uniqueConstraints: Array<ReadonlyArray<string>> = [];

    private readonly _uniqueKeySet = new Set<string>();
    
    __type(): { modelContext: TCtor | true } {
        return { modelContext: true };
    }

    table(options: TableOptions<TSuperModel>): this {
        this._tableOptions = options;
        return this;
    }

    unique(...paths : UniqueKeys<CtorMembers<TCtor>>[]): this {
        this._uniqueConstraints.push(paths);
        return this;
    }

    _validateUnique(paths: ReadonlyArray<string>) {
        const arr = [...paths].sort();
        for (let i = 1; i < arr.length; i++) {
            if (arr[i - 1] === arr[i]) {
                throw new ArgumentError(`Duplicated property path "${arr[i]}"`);
            }
        }
        const key = arr.join(",");
        if (this._uniqueKeySet.has(key)) {
            throw new ArgumentError(`Duplicated unique constraints [${paths.join(", ")}]`);
        }
        this._uniqueKeySet.add(key);
    }

    toModelOptions(): ModelOptions {
        return {
            tableOptions: this._tableOptions,
            uniqueConstraints: this._uniqueConstraints
        };
    }
}

let _nextModelIdentifier = 0;

export function allocateModelIdentifier(): number {
    return ++_nextModelIdentifier;
}

export const ALL_MODEL_MAP = new Map<string, AnyModelImpl>();
