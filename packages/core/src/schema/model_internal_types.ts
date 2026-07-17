import { FlattenMembers } from "@/utils";
import { DatabaseIdentifier } from "./database_identifier";
import { AssociatedPropContract, AssociationType, EmbeddedPropContract, ManyToManyPropContract, ManyToOnePropContract, OneToOnePropContract, ScalarPropContract } from "./prop_internal_types";
import { AnyModel, DV_ABSTRACT, DV_MODEL_NAME, Model, TB_INHERIT } from "./model";

export type ModelCreator = {
    
    <
        TName extends string, 
        TIdKey extends keyof CtorMembers<TCtor> & string,
        TCtor extends Ctor
    >(
        name: TName,
        idKey: TIdKey,
        ctor: TCtor,
        configurator?: (ctx: ModelContext<TCtor, never>) => void
    ): Model<TName, TIdKey, TCtor, CtorMembers<TCtor>, never>;

    extends<
        TSuperModel extends AnyModel
    >(
        superModel: TSuperModel
    ): InheritanceModelCreator<TSuperModel>;
};

export type InheritanceModelCreator<
    TSuperModel extends AnyModel
> = {
    
    <
        TName extends string, 
        TCtor extends Ctor
    >(
        name: OtherString<TName, ModelName<TSuperModel> | ModelSuperNames<TSuperModel>>,
        ctor: TCtor,
        configurator?: (ctx: ModelContext<TCtor, TSuperModel>) => void
    ): Model<
        TName, 
        SuperIdKey<TSuperModel>, 
        TCtor, 
        MakeAllModelMembers<TCtor, TSuperModel>,
        ModelName<TSuperModel> | ModelSuperNames<TSuperModel>
    >;
};

export type OtherString<T extends string, X extends string> =
    T extends X
        ? never
        : T;

export interface ModelContext<TCtor extends Ctor, TSuperModel extends AnyModel | never> {
    
    __type(): { modelContext: TCtor | true };

    table(options: TableOptions<TSuperModel>): this;

    unique(...paths : UniqueKeys<CtorMembers<TCtor>>[]): this;
}

export type SuperIdKey<TSuperModel extends AnyModel> =
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

export type MakeAllModelMembers<TCtor extends Ctor, TSuperModel extends AnyModel | undefined> =
    TSuperModel extends undefined 
        ? CtorMembers<TCtor>
        : TSuperModel extends Model<any, any, any, infer TAllMembers, any>
            ? TAllMembers & CtorMembers<TCtor>
            : never;

export type CtorMembers<TCtor extends Ctor> =
    TCtor["prototype"];

export type OneToOneMappedByKeys<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? ExpectedKeysImpl<
            CtorMembers<TCtor>, 
            OneToOnePropContract<any, any, "OWNING", any, any, any>
        > & string :
        never;

export type OneToManyMappedByKeys<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? ExpectedKeysImpl<
            CtorMembers<TCtor>, 
            ManyToOnePropContract<any, any, "OWNING", any, any, any>
        > & string :
        never;

export type ManyToManyMappedByKeys<TModel extends AnyModel> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? ExpectedKeysImpl<
            CtorMembers<TCtor>, 
            ManyToManyPropContract<any, "OWNING", any, any, any>
        > & string :
        never;

export type MiddleEntityJoinThisKeys<
    TModel extends AnyModel, 
    TAssociationType extends AssociationType
> =
    TModel extends Model<any, any, infer TCtor, any, any>
        ? ExpectedKeysImpl<
            CtorMembers<TCtor>, 
            TAssociationType extends "ONE_TO_ONE"
                ? OneToOnePropContract<any, any, "OWNING", any, any, any>
            : TAssociationType extends "ONE_TO_MANY"
                ? OneToOnePropContract<any, any, "OWNING", any, any, any>
            : ManyToOnePropContract<any, any, "OWNING", any, any, any>
        > & string :
        never;

export type MiddleEntityJoinTargetKeys<
    TMiddleModel extends AnyModel,
    TTargetModel extends AnyModel,
    TAssociationType extends AssociationType
> = TMiddleModel extends Model<any, any, infer TCtor, any, any>
        ? ExpectedKeysImpl<
            CtorMembers<TCtor>, 
            TAssociationType extends "ONE_TO_ONE"
                ? OneToOnePropContract<TTargetModel, any, "OWNING", any, any, any>
            : TAssociationType extends "MANY_TO_ONE"
                ? OneToOnePropContract<TTargetModel, any, "OWNING", any, any, any>
            : ManyToOnePropContract<TTargetModel, any, "OWNING", any, any, any>
        > & string :
        never;

export type ExpectedKeysImpl<
    TModelMembers, 
    TExpectedProp extends AssociatedPropContract<any, any, "OWNING", any, any, any>
> = 
    TModelMembers extends object 
        ? { 
            [K in keyof TModelMembers]: 
                TModelMembers[K] extends TExpectedProp
                    ? K
                    : never
        }[keyof TModelMembers] :
        never;

export type CalculatorSourceKeys<
    TModelMembers
> =
    TModelMembers extends object 
    ? { 
        [K in keyof TModelMembers]: 
            TModelMembers[K] extends ScalarPropContract<any, any>
                ? K
            : TModelMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
            : never
    }[keyof TModelMembers] :
    never;

export type TableOptions<TSuperModel extends AnyModel | never> = 
    DatabaseIdentifier<string> | {
        readonly name?: typeof TB_INHERIT
            | DatabaseIdentifier<string>
            | IdRemappedTable<TSuperModel>;
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

export type IdRemappedTable<TSuperModel extends AnyModel | never> = 
    TSuperModel extends AnyModel
        ? {
            readonly value?: DatabaseIdentifier<string>;
            readonly idMapping?: AllModelMembers<TSuperModel>[ModelIdKey<TSuperModel>] extends EmbeddedPropContract<any, any, infer R>
                ? { readonly [K in keyof R]: DatabaseIdentifier<string> }
                : DatabaseIdentifier<string>
        }
        : never;

export type UniqueKeys<TMembers extends object> =
    UniqueKeysImpl<FlattenMembers<TMembers>>;

export type UniqueKeysImpl<TFlattenCtorMembers> = 
    TFlattenCtorMembers extends object
        ? { 
            [K in keyof TFlattenCtorMembers]: 
                TFlattenCtorMembers[K] extends (
                    ScalarPropContract<any, any> 
                    | OneToOnePropContract<any, any, "OWNING", false, any, any>
                    | ManyToOnePropContract<any, any, "OWNING", false, any, any>
                )
                    ? K
                    : never
        }[keyof TFlattenCtorMembers]
        : never;

export type OrderedKeys<TModel extends AnyModel> =
    OrderedKeysImpl<FlattenMembers<AllModelMembers<TModel>>>;

export type OrderedKeysImpl<TFlattenCtorMembers extends object> = 
    { 
        [K in keyof TFlattenCtorMembers]: 
            TFlattenCtorMembers[K] extends ScalarPropContract<any, any>
                ? K
                : never
    }[keyof TFlattenCtorMembers];

export type OptionalModelKey<TModel extends AnyModel> = 
    ((keyof AllModelMembers<TModel>) & string) | "";

export type RequiredModelKey<
    TModel extends AnyModel, 
    TKey extends OptionalModelKey<TModel>
> =
    TKey extends ""
        ? ModelIdKey<TModel> & string
        : TKey;

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

export type DerivedModel<
    TDerivedModel extends AnyModel,
    TSuperModel extends AnyModel
> = IsDerivedModelOf<TDerivedModel, TSuperModel> extends true
    ? TDerivedModel :
    never;
