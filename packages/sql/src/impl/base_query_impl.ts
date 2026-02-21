import { AnyModel, AtLeastOne, BaseModel, BaseQuery, BaseQueryMapOf, BaseQuerySelectMapArgs, ExpressionLike, metadata, RecursiveMutableBaseQuery, Table } from "@ts-grm/core";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { defaultQueryOptions, QueryOptions } from "./query_options";

export class BaseQueryImpl<TProjection> implements metadata.BaseQueryImplementor<TProjection> {

    private readonly options: QueryOptions;

    constructor(
        private readonly mutableQuery: MutableBaseQueryImpl,
        private readonly args: BaseQueryMapOf<TProjection>,
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
    ): BaseModel<BaseQueryMapOf<TProjection>> {
        return new BaseModelImpl(this.args, isCte);
    }
}

export class BaseModelImpl<T extends BaseQuerySelectMapArgs> implements BaseModel<T> {

    __type(): {
        tableLike: true;
        baseTable: T | true;
    } {
        return {tableLike: true, baseTable: true };
    }

    constructor(
        readonly args: T,
        readonly isCte: boolean
    ) {}
}