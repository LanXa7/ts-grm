import { AssociatedProp, ManyToManyProp, ManyToOneProp, OneToOneProp, ScalarProp } from "@/schema/prop";
import { FlattenMembers } from "@/utils";
import { ModelContextImpl, ModelImpl } from "@/impl/model_impl";
import { DatabaseIdentifier } from "./database_identifier";

export const model: ModelCreator = modelImpl();

function modelImpl(): ModelCreator {

    function create<
        TName extends string, 
        TIdKey extends keyof CtorMembers<TCtor> & string,
        TCtor extends Ctor
    >(
        name: TName,
        idKey: TIdKey,
        ctor: TCtor,
        configurator?: (ctx: ModelContext<TCtor>) => void
    ): Model<TName, TIdKey, TCtor, CtorMembers<TCtor>, never> {
        const ctx = new ModelContextImpl<TCtor>();
        if (configurator != null) {
            configurator(ctx);
        }
        return new ModelImpl(name, idKey, ctor, undefined, ctx.toModelOptions());
    }

    function ext<
        TSuperModel extends AnyModel
    >(
        superModel: TSuperModel
    ): InheritanceModelCreator<TSuperModel> {
        return <
            TName extends string, 
            TCtor extends Ctor
        >(
            name: TName,
            ctor: TCtor,
            configurator?: (ctx: ModelContext<TCtor>) => void
        ): Model<
            TName, 
            SuperIdKey<TSuperModel>, 
            TCtor, 
            MakeAllModelMembers<TCtor, TSuperModel>,
            ModelName<TSuperModel> | ModelSuperNames<TSuperModel>
        > => {
            const ctx = new ModelContextImpl<TCtor>();
            if (configurator != null) {
                configurator(ctx);
            }
            return new ModelImpl<
                TName, 
                SuperIdKey<TSuperModel>, 
                TCtor, 
                MakeAllModelMembers<TCtor, TSuperModel>,
                ModelName<TSuperModel> | ModelSuperNames<TSuperModel>
            >(
                name, 
                undefined, 
                ctor, 
                superModel,
                ctx.toModelOptions()
            );
        }
    }
    create.extends = ext;
    return create as any as ModelCreator;
}

type ModelCreator = {
    
    <
        TName extends string, 
        TIdKey extends keyof CtorMembers<TCtor> & string,
        TCtor extends Ctor
    >(
        name: TName,
        idKey: TIdKey,
        ctor: TCtor,
        configurator?: (ctx: ModelContext<TCtor>) => void
    ): Model<TName, TIdKey, TCtor, CtorMembers<TCtor>, never>;

    extends<
        TSuperModel extends AnyModel
    >(
        superModel: TSuperModel
    ): InheritanceModelCreator<TSuperModel>;
};

type InheritanceModelCreator<
    TSuperModel extends AnyModel
> = {
    
    <
        TName extends string, 
        TCtor extends Ctor
    >(
        name: OtherString<TName, ModelName<TSuperModel> | ModelSuperNames<TSuperModel>>,
        ctor: TCtor,
        configurator?: (ctx: ModelContext<TCtor>) => void
    ): Model<
        TName, 
        SuperIdKey<TSuperModel>, 
        TCtor, 
        MakeAllModelMembers<TCtor, TSuperModel>,
        ModelName<TSuperModel> | ModelSuperNames<TSuperModel>
    >;
};

type OtherString<T extends string, X extends string> =
    T extends X
        ? never
        : T;

export interface Model<
    TName extends string, 
    TIdKey extends string = string,
    TCtor extends Ctor = Ctor,
    TAllMembers extends object = object,
    TSuperNames extends string | never = never
> {
    __type(): {
        model: [TName, TIdKey, TCtor, TAllMembers, TSuperNames] | true
    }
}

export type AnyModel = Model<any, any, any, any, any>;

export interface ModelContext<TCtor extends Ctor> {
    
    __type(): { modelContext: TCtor | true };

    table(options: TableOptions): this;

    unique(...paths : UniqueKeys<CtorMembers<TCtor>>[]): this;
}

type SuperIdKey<TSuperModel extends AnyModel> =
    TSuperModel extends Model<any, infer IdKey, any, any, any>
        ? IdKey
        : never;

export interface Ctor {
    new (): any;
    readonly prototype: {
        readonly [key: string]: any 
    };
}

export type ModelName<TModel extends AnyModel> =
    TModel extends Model<infer TName, any, any, any, any>
        ? TName
        : never;

export type ModelIdKey<TModel extends AnyModel> =
    TModel extends Model<any, infer TId, any, any, any>
        ? TId
        : never;

export type ModelSuperNames<TModel extends AnyModel> =
    TModel extends Model<any, any, any, any, infer TSuperNames>
        ? TSuperNames
        : never;

export type ModelCtor<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? TCtor
        : never;

export type DeclaredModelMembers<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? CtorMembers<TCtor>
        : never;

export type AllModelMembers<TModel extends AnyModel> =
    TModel extends Model<any, any, any, infer TAllMembers, any>
        ? TAllMembers
        : never;

type MakeAllModelMembers<TCtor extends Ctor, TSuperModel extends AnyModel | undefined> =
    TSuperModel extends undefined 
        ? CtorMembers<TCtor>
        : TSuperModel extends Model<any, any, any, infer TAllMembers, any>
            ? TAllMembers & CtorMembers<TCtor>
            : never;

export type CtorMembers<TCtor extends Ctor> =
    TCtor["prototype"];

export type OneToOneMappedByKeys<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? MappedByKeysImpl<
            CtorMembers<TCtor>, 
            OneToOneProp<any, any, "OWNING", any>
        > & string :
        never;

export type OneToManyMappedByKeys<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? MappedByKeysImpl<
            CtorMembers<TCtor>, 
            ManyToOneProp<any, any, "OWNING", any>
        > & string :
        never;

export type ManyToManyMappedByKeys<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? MappedByKeysImpl<
            CtorMembers<TCtor>, 
            ManyToManyProp<any, any, "OWNING">
        > & string :
        never;

type MappedByKeysImpl<TModelMembers, TExpectedProp extends AssociatedProp<any, any, "OWNING">> = 
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends TExpectedProp
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

export type TableOptions = 
    DatabaseIdentifier<string> | {
        readonly name?: DatabaseIdentifier<string> | typeof INHERIT_SUPER_TABLE;
        readonly discriminatorValue?: 
            typeof DV_ABSTRACT
            | typeof DV_MODEL_NAME
            | string
            | number;
        readonly discriminator?: string | {
            readonly name: string;
            readonly type?: "string" | "number"
        };
    };

export const INHERIT_SUPER_TABLE = Symbol("<inherit>");

export type SpecialDiscriminatorValueType = 
    typeof DV_ABSTRACT | typeof DV_MODEL_NAME;

export const DV_ABSTRACT = Symbol("<abstract>");

export const DV_MODEL_NAME = Symbol("<modelName>");

export type UniqueKeys<TMembers extends object> =
    UniqueKeysImpl<FlattenMembers<TMembers>>;

type UniqueKeysImpl<TFlattenCtorMembers> = 
    TFlattenCtorMembers extends object
        ? { 
            [K in keyof TFlattenCtorMembers]: 
                TFlattenCtorMembers[K] extends (
                    ScalarProp<any, any> 
                    | OneToOneProp<any, any, "OWNING", any>
                    | ManyToOneProp<any, any, "OWNING", any>
                )
                    ? K
                    : never
        }[keyof TFlattenCtorMembers]
        : never;

export type OrderedKeys<TModel extends AnyModel> =
    OrderedKeysImpl<FlattenMembers<AllModelMembers<TModel>>>;

type OrderedKeysImpl<TFlattenCtorMembers extends object> = 
    { 
        [K in keyof TFlattenCtorMembers]: 
            TFlattenCtorMembers[K] extends ScalarProp<any, any>
                ? K
                : never
    }[keyof TFlattenCtorMembers];

export type ReferenceKey<TModel extends AnyModel> = 
    (keyof AllModelMembers<TModel>) & string;

export type Extends<
    TModel1 extends AnyModel,
    TModel2 extends AnyModel
> =
    ModelName<TModel1> extends ModelName<TModel2>
        ? true
        : IsDerivedModelOf<TModel1, TModel2>;

export type IsDerivedModelOf<
    TModel1 extends AnyModel,
    TModel2 extends AnyModel
> = ModelSuperNames<TModel1> extends never
            ? false
            : ModelName<TModel2> extends ModelSuperNames<TModel1>
                ? true
                : false;