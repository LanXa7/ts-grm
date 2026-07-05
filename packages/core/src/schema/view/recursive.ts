import { EntityTable, Predicate } from "@/dsl";
import { AnyModel, IsDerivedModelOf, ModelName } from "../model";
import { AssociatedPropContract, CollectionPropContract, ReferencePropContract } from "../prop_contract";
import { ModelOrder } from "../order";
import { ViewNullType } from "../dto";
import { RestrictKeys, TypeWithNullity } from "./common";

export interface Recursive<
    TModel extends AnyModel, 
    TMembers,
    TArgs extends RecursiveArgs<TModel, TMembers>
> {
    (ctx: RecursiveContext<TModel, TMembers>): TArgs;
}

interface RecursiveContext<TModel extends AnyModel, TMembers> {

    <const TArgs extends RecursiveArgs<TModel, TMembers>>(
        args: RestrictKeys<TArgs, keyof RecursiveArgs<TModel, TMembers>>
    ): TArgs;
}

export type RecursiveArgs<TModel extends AnyModel, TMembers> =
    {
        [
            K in RecursiveKeys<TModel, TMembers>
        ]?: RecursivePropArgs<TMembers[K & keyof TMembers]>;
    };

export type RecursiveKeys<TModel extends AnyModel, TMembers> = 
    keyof {
        [K in keyof TMembers
            as IsRecursiveProp<TModel, TMembers[K]> extends true
                ? K & string
                : never
        ]: never
    };

type IsRecursiveProp<TModel extends AnyModel, TProp> =
    TProp extends AssociatedPropContract<infer TargetModel, any, any, any, any, any>
        ? Extends<TModel, TargetModel> extends true
            ? true
            : false
        : false;

type Extends<
    TModel1 extends AnyModel,
    TModel2 extends AnyModel
> =
    ModelName<TModel1> extends ModelName<TModel2>
        ? true
        : IsDerivedModelOf<TModel1, TModel2>;

type RecursivePropArgs<TProp> = 
    TProp extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
        ? RecursiveReferencePropArgs<TargetModel>
    : TProp extends CollectionPropContract<infer TargetModel, any, any, any, any>
        ? RecursiveCollectionPropArgs<TargetModel>
    : never;

type RecursiveReferencePropArgs<TModel extends AnyModel> = 
    true | {
        readonly alias?: string;
        readonly depth?: number;
        readonly filter?: (table: EntityTable<TModel>) => Predicate | null;
    };

type RecursiveCollectionPropArgs<TModel extends AnyModel> = 
    true | {
        readonly alias?: string;
        readonly depth?: number;
        readonly filter?: (table: EntityTable<TModel>) => Predicate | null;
        readonly orders?: ReadonlyArray<ModelOrder<TModel>>;
        readonly limit?: number;
    };

export type ApplyRecursive<
    T, 
    TViewArgs,
    TMembers,
    TViewNullType extends ViewNullType
> = 
    TViewArgs extends { $recursive: Recursive<infer _, TMembers, infer RecursiveArgs> }
        ? T & {
            [K in keyof RecursiveArgs
                as RecursiveArgs[K] extends { alias: infer Alias extends string }
                    ? Alias
                    : K
            ]: 
                TMembers[K & keyof TMembers] extends ReferencePropContract<any, any, any, any, any, any>
                    ? ApplyRecursiveReference<
                        T, 
                        K & string, 
                        RecursiveArgs[K],
                        TViewNullType
                    >
                    : ApplyRecursiveCollection<
                        T, 
                        K & string, 
                        RecursiveArgs[K],
                        TViewNullType
                    >
        }
        : T;

type ApplyRecursiveReference<
    T,
    TName extends string,
    TRecursivePropArgs,
    TViewNullType extends ViewNullType
> = 
    TypeWithNullity<
        T & {
            [
                K in TName 
                as 
                    TRecursivePropArgs extends { alias: infer Alias extends string }
                        ? Alias
                        : TName
            ]: ApplyRecursiveReference<T, TName, TRecursivePropArgs, TViewNullType>
        },
        "NULLABLE",
        TViewNullType
    >;

type ApplyRecursiveCollection<
    T,
    TName extends string,
    TRecursivePropArgs,
    TViewNullType extends ViewNullType
> = 
    TypeWithNullity<
        Array<
            T & {
                [
                    K in TName 
                    as 
                        TRecursivePropArgs extends { alias: infer Alias extends string }
                            ? Alias
                            : TName
                ]: ApplyRecursiveCollection<T, TName, TRecursivePropArgs, TViewNullType>
            }
        >,
        TRecursivePropArgs extends { depth: number }
            ? "NULLABLE"
            : "NONNULL",
        TViewNullType
    >;