import { __AllModelMembers } from "@/schema/model_internal_types";
import { BaseQuerySelectMapArgs, BaseModel } from "./base_query";
import { AnyAssociationModel, AssociationTable } from "./association";
import { __EntityTableMembers, __JoinPolicyType, __MakeTableWithJoinPolicy, __ModelLike, __WeakJoinAction } from "./table_internal_types";
import { AnyModel } from "@/schema/model";
import { Predicate } from "./expression";

export type Table<T extends __ModelLike, TJoinPolicy extends __JoinPolicyType = "REFERENCE"> =
    T extends AnyModel
        ? EntityTable<T, TJoinPolicy>
    : T extends BaseModel<infer TMap>
        ? BaseTable<TMap, TJoinPolicy>
    : T extends AnyAssociationModel
        ? AssociationTable<T>
    : never;

export type EntityTable<TModel extends AnyModel, TJoinPolicy extends __JoinPolicyType = "REFERENCE"> = 
    __EntityTableMembers<TModel, __AllModelMembers<TModel>, "NONNULL", TJoinPolicy>;

export type BaseTable<
    TMap extends BaseQuerySelectMapArgs,
    TJoinPolicy extends __JoinPolicyType = "REFERENCE"
> = {
    __type(): { 
        tableLike: true; 
        baseTable: true; 
    };
} & {
    readonly [K in keyof TMap]: 
        TMap[K] extends __EntityTableMembers<any, any, any, any>
            ? __MakeTableWithJoinPolicy<TMap[K], TJoinPolicy>
            : TMap[K];
} & __WeakJoinAction<BaseModel<TMap>, TJoinPolicy>;

export type JoinType = "INNER" | "LEFT";

export interface FilterType<
    TParentModel extends __ModelLike, 
    TModel extends __ModelLike
> {
    (ctx: FilterContextType<TParentModel, TModel>): Predicate | undefined;
}

export interface FilterContextType<
    TParentModel extends __ModelLike, 
    TModel extends __ModelLike
> {
    readonly source: Table<TParentModel>;
    readonly target: Table<TModel>;
};