import { count } from "./aggregate";
import { and, constant, not, or } from "./expression";
import { all, any, exists, notExists, subQuery } from "./sub_query";
import { unionAll, union, minus, intersect } from "./merged_query";
import { num } from "./native";
import { baseQuery, cteModel, derivedModel } from "./base-query";
import { tuple } from "./tuple";
export { ExpressionOrder } from "./utils";
export type { SqlClient } from "./sql_client";
export type { AtLeastOne } from "./utils";
export type { Criteria } from "./criteria";
export type { 
    RootQuery, 
    MutableRootQuery, 
    RootQueryProjection, 
    RootQuerySelectArrArgs, 
    RootQuerySelectMapArgs, 
    RootQuerySelection, 
    RowTypeOf 
} from "./root_query";
export type { 
    SubQueryLike, 
    ExpressionSubQuery, 
    TupleSubQuery, 
    MutableSubQuery,
    SubQueryProjection
} from "./sub_query";
export type { 
    BaseQuery, 
    MutableBaseQuery,
    RecursiveMutableBaseQuery, 
    BaseModel,
    BaseQuerySelectMapArgs,
    BaseQueryProjection,
    BaseQueryMapOf
} from "./base-query";
export type { Table, JoinType, EntityTable, BaseTable } from "./table";
export type { LikeMode, Expression, ExpressionLike, Predicate } from "./expression";

export const dsl = {
    subQuery,
    count,
    and,
    or,
    not,
    all,
    any,
    exists,
    notExists,
    unionAll,
    union,
    minus,
    intersect,
    baseQuery,
    derivedModel,
    cteModel,
    constant,
    tuple,
    native: {
        num
    }
};
