import { AnyModel, AtLeastOne, BaseModel, BaseQuery, BaseQueryMapOf, BaseQueryProjection, BaseQuerySelectMapArgs, BaseTable, dsl, metadata, RecursiveMutableBaseQuery, Table } from "@ts-grm/core";
import { toTables } from "./utils";
import { RecursiveMutableBaseQueryImpl } from "./recursive_mutable_base_query_impl";
import { MapBaseQueryProjection } from "./query_projection";
import { AtomBaseQueryImpl } from "./atom_base_query_impl";

export abstract class AbstractBaseQueryImpl<TProjection> 
implements metadata.BaseQueryImplementor<TProjection> {

    abstract __type(): { 
        baseQuery: TProjection | true; 
    };

    unionAllRecursively<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: RecursiveMutableBaseQuery<TProjection>,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): BaseQuery<TProjection> {
        const prev = metadata.createTypedBaseTable(this.toModel(true)) as BaseTable<BaseQueryMapOf<TProjection>>;
        const tables = toTables(args);
        const mutableQuery = new RecursiveMutableBaseQueryImpl<TProjection>(prev, tables);
        const fnArgs = [ mutableQuery, ...tables ];
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as MapBaseQueryProjection<BaseQueryMapOf<TProjection>>;
        const newQuery = new AtomBaseQueryImpl(mutableQuery, projection, undefined);
        return dsl.unionAll(this, newQuery);
    }

    abstract get args(): BaseQueryMapOf<TProjection>;

    toModel(
        isCte: boolean
    ): metadata.BaseModelImplementor<BaseQueryMapOf<TProjection>> {
        return new BaseModelImpl(this as any, isCte);
    }
}

export class BaseModelImpl<T extends BaseQuerySelectMapArgs> implements metadata.BaseModelImplementor<T> {

    __type(): {
        baseModel: T | true;
    } {
        return { baseModel: true };
    }

    private readonly _args: T;

    constructor(
        private readonly _query: AbstractBaseQueryImpl<BaseQueryProjection<T>>,
        readonly __isCte: boolean,
    ) {
        this._args = metadata.withShadowAnchor(_query.args, this);
    }

    get __args(): T {
        return this._args;
    }

    __toQuery(): metadata.BaseQueryImplementor<BaseQueryProjection<T>> {
        return this._query;
    }
}