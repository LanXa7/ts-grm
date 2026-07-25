import { count, sum, min, max, avg } from "./aggregate";
import { and, constant, not, or } from "./expression";
import { all, any, exists, notExists, subQuery } from "./sub_query";
import { unionAll, union, except, exceptAll, intersect, intersectAll } from "./merged_query";
import { native } from "./native";
import { baseQuery, cteModel, derivedModel } from "./base_query";
import { associationModel } from "./association";
import { tuple } from "./tuple";
export { ExpressionOrder } from "./utils";
export type { 
    SqlClient, 
    Propagation, 
    Isolation, 
    TransactionOptions, 
    Schema,  
    FindManyOptions,
    FindRangeOptions,
    FindPageOptions
} from "./sql_client";
export type { AtLeastOne, AtLeastTwo } from "./utils";
export type { Criteria } from "./criteria";
export { criteria } from "./criteria";
export type { ExprTuple, ExprTupleMatchable } from "./tuple";
export type { FetchPageOptions, FetchRangeOptions, Page } from "./page";
export type { 
    RootQuery, 
    AtomRootQuery,
    MutableRootQuery, 
    RootQueryProjection, 
    RootQuerySelectArrArgs, 
    RootQuerySelectMapArgs, 
    RootQuerySelection, 
    RowTypeOf,
    FetchOptions,
    FetchedView,
    SelectionLike
} from "./root_query";
export type { 
    SubQueryLike, 
    ExpressionSubQuery, 
    AtomExpressionSubQuery,
    TupleSubQuery, 
    AtomTupleSubQuery,
    MutableSubQuery,
    SubQuerySelectArrArgs,
    SubQueryProjection
} from "./sub_query";
export type { 
    BaseQuery, 
    AtomBaseQuery,
    MutableBaseQuery,
    RecursiveMutableBaseQuery, 
    BaseModel,
    BaseQuerySelectMapArgs,
    BaseQueryProjection,
    BaseQueryMapOf
} from "./base_query";
export type { AssociationModel, AnyAssociationModel } from "./association";
export type { 
    Table, 
    EntityTable, 
    BaseTable, 
    JoinType,
    FilterType,
    FilterContextType
} from "./table";
export type { 
    Predicate,
    LikeMode, 
    ExpressionLike, 
    Expression, 
    CmpExpression,
    NumExpression,
    StrExpression,
    DateExpression,
    EnumSetExpression,
    ExprContract,
    CmpExprContract,
    NumExprContract,
    StrExprContract,
    DateExprContract,
    EnumSetExprContract
} from "./expression";

export const dsl = {
    subQuery,
    count,
    sum,
    min,
    max,
    avg,
    and,
    or,
    not,
    all,
    any,
    exists,
    notExists,
    unionAll,
    union,
    except,
    exceptAll,
    intersect,
    intersectAll,
    baseQuery,
    derivedModel,
    cteModel,
    associationModel,
    constant,
    tuple,
    native
} as const;
