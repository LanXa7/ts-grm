import { AnyModel, AtLeastOne, BaseModel, BaseQuery, BaseQueryMapOf, BaseQueryProjection, BaseQuerySelectMapArgs, metadata, RecursiveMutableBaseQuery, Table } from "@ts-grm/core";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { defaultQueryOptions, QueryOptions } from "./query_options";

export class BaseQueryImpl<TProjection> implements metadata.BaseQueryImplementor<TProjection> {

    private readonly options: QueryOptions;

    constructor(
        private readonly mutableQuery: MutableBaseQueryImpl,
        readonly args: BaseQueryMapOf<TProjection>,
        options: QueryOptions | undefined
    ) {
        this.options = options ?? defaultQueryOptions;
    }

    __type(): { baseQuery: TProjection | true; } {
        return { baseQuery: true };
    }

    distinct(): BaseQuery<TProjection> {
        return new BaseQueryImpl(
            this.mutableQuery,
            this.args,
            {...this.options, distinct: true }
        );
    }

    limit(limit: number): BaseQuery<TProjection> {
        return new BaseQueryImpl(
            this.mutableQuery,
            this.args,
            {...this.options, limit }
        );
    }

    offset(offset: number): BaseQuery<TProjection> {
        return new BaseQueryImpl(
            this.mutableQuery,
            this.args,
            {...this.options, offset }
        );
    }

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
        throw new Error();
    }

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

    constructor(
        private readonly _query: BaseQueryImpl<BaseQueryProjection<T>>,
        readonly __isCte: boolean,
    ) {}

    get __args(): T {
        return this._query.args;
    }

    toQuery(): metadata.BaseQueryImplementor<BaseQueryProjection<T>> {
        return this._query;
    }
}