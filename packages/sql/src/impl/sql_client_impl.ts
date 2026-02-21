import { SqlClientOptions } from "@/cfg";
import { Driver } from "@/driver/deriver";
import { SqlClientImplementor } from "@/sql_client";
import type { 
    Criteria, 
    View, 
    TypeOf, 
    ModelOf, 
    AtLeastOne, 
    AnyModel,
    BaseModel,
    RootQueryProjection,
    RootQuery,
    MutableRootQuery,
    Table,
    BaseQuery,
    MutableBaseQuery,
    MutableSubQuery,
    ExpressionSubQuery,
    TupleSubQuery,
    Expression,
    BaseQueryProjection,
    SubQueryProjection,
    BaseQueryMapOf
} from "@ts-grm/core";
import { supressUnused, metadata, ast } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { RootQueryImpl } from "./root_query_impl";
import { AbstractRootQueryProjection, MapBaseQueryProjection } from "./query_projection";
import { BaseModelImpl, BaseQueryImpl } from "./base_query_impl";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";

export class SqlClientImpl implements SqlClientImplementor {

    __type(): { sqlClient: undefined } {
        return { sqlClient: undefined }
    }

    constructor(
        readonly driver: Driver,
        readonly options: SqlClientOptions
    ) {}

    findNonNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V>> {
        supressUnused(view);
        supressUnused(criteria);
        throw new Error();
    }

    createQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends RootQueryProjection<any>
    >(
        ...args: [
            ...symbols: TModels,
            fn: (
                q: MutableRootQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): RootQuery<TProjection> {
        const mutableQuery = new MutableRootQueryImpl(this);
        const fnArgs: Array<any> = [ mutableQuery ];
        for (let i = 0; i < args.length - 1; i++) {
            const model = args[i];
            if (model instanceof BaseModelImpl) {
                fnArgs[i + 1] = metadata.createTypedBaseTable(model.args);
            } else {
                fnArgs[i + 1] = metadata.Entity.of(args[i] as AnyModel).table(undefined);
            }
        }
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as AbstractRootQueryProjection<any>;
        return new RootQueryImpl<TProjection>(mutableQuery, projection, undefined);
    }
}

class QueryFactoryImpl implements ast.QueryFactory {
    
    createSubQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends SubQueryProjection<any, any> | void
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: MutableSubQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): TProjection extends SubQueryProjection<infer T, infer Kind>
        ? Kind extends "EXPRESSION"
            ? ExpressionSubQuery<T>
            : TupleSubQuery<T>
        : TProjection extends void
            ? ExpressionSubQuery<Expression<number>>
        : never {
        supressUnused(args);
        throw new Error();
    }
        
    createBaseQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends BaseQueryProjection<any>
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: MutableBaseQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): BaseQuery<TProjection> {
        const mutableQuery = new MutableBaseQueryImpl();
        const fnArgs: Array<any> = [ mutableQuery ];
        for (let i = 0; i < args.length - 1; i++) {
            const model = args[i];
            if (model instanceof BaseModelImpl) {
                fnArgs[i + 1] = metadata.createTypedBaseTable(model.args);
            } else {
                fnArgs[i + 1] = metadata.Entity.of(args[i] as AnyModel).table(undefined);
            }
        }
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as MapBaseQueryProjection<BaseQueryMapOf<TProjection>>;
        return new BaseQueryImpl(mutableQuery, projection.args, undefined);
    }
}

const queryFactory = new QueryFactoryImpl();

ast.setQueryFactory(queryFactory);