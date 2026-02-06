import { count } from "./aggregate";
import { and, constant, not, or } from "./expression";
import { all, any, exists, notExists, subQuery } from "./sub-query";
import { unionAll, union, minus, intersect } from "./merged-query";
import { num } from "./native";
import { baseQuery, cteModel, derivedModel } from "./base-query";
import { tuple } from "./tuple";
export type { SqlClient } from "./sql-client";
export type { AtLeastOne } from "./utils";
export type { Criteria } from "./criteria";
export type { RootQuery, MutableRootQuery, RootQueryProjection } from "./root-query";
export type { SubQueryLike, ExpressionSubQuery, TupleSubQuery, MutableSubQuery } from "./sub-query";
export type { BaseQuery, MutableBaseQuery, BaseModel } from "./base-query";
export type { Table } from "./table";

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
