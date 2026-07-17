import { AllModelMembers } from "@/schema/model_internal_types";
import { BaseQuerySelectMapArgs, BaseModel } from "./base_query";
import { AnyAssociationModel, AssociationTable } from "./association";
import { EntityTableMembers, JoinPolicyType, MakeTableWithJoinPolicy, ModelLike, WeakJoinAction } from "./table_internal_types";
import { AnyModel } from "@/schema/model";

export type Table<T extends ModelLike, TJoinPolicy extends JoinPolicyType = "REFERENCE"> =
    T extends AnyModel
        ? EntityTable<T, TJoinPolicy>
    : T extends BaseModel<infer TMap>
        ? BaseTable<TMap, TJoinPolicy>
    : T extends AnyAssociationModel
        ? AssociationTable<T>
    : never;

export type EntityTable<TModel extends AnyModel, TJoinPolicy extends JoinPolicyType = "REFERENCE"> = 
    EntityTableMembers<TModel, AllModelMembers<TModel>, "NONNULL", TJoinPolicy>;

export type BaseTable<
    TMap extends BaseQuerySelectMapArgs,
    TJoinPolicy extends JoinPolicyType = "REFERENCE"
> = {
    __type(): { 
        tableLike: true; 
        baseTable: true; 
    };
} & {
    readonly [K in keyof TMap]: 
        TMap[K] extends EntityTableMembers<any, any, any, any>
            ? MakeTableWithJoinPolicy<TMap[K], TJoinPolicy>
            : TMap[K];
} & WeakJoinAction<BaseModel<TMap>, TJoinPolicy>;

export type JoinType = "INNER" | "LEFT";