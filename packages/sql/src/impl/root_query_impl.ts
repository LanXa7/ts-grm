import type { RootQuery, RootQueryProjection, RowTypeOf } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AbstractRootQueryProjection } from "./query_projection";
import { defaultQueryOptions, QueryOptions } from "./query_options";

export class RootQueryImpl<TProjection extends RootQueryProjection<any>> 
implements RootQuery<TProjection> {

    private readonly options: QueryOptions;

    constructor(
        private readonly mutableQuery: MutableRootQueryImpl,
        private readonly projection: AbstractRootQueryProjection<any>,
        options: QueryOptions | undefined
    ) {
        this.options = options ?? defaultQueryOptions;
    }

    __type(): { rootQuery: TProjection | true; } {
        return { rootQuery: true };
    }

    distinct(): RootQuery<TProjection> {
        return new RootQueryImpl(
            this.mutableQuery,
            this.projection,
            {...this.options, distinct: true }
        );
    }

    limit(limit: number): RootQuery<TProjection> {
        return new RootQueryImpl(
            this.mutableQuery,
            this.projection,
            {...this.options, limit }
        );
    }

    offset(offset: number): RootQuery<TProjection> {
        return new RootQueryImpl(
            this.mutableQuery,
            this.projection,
            {...this.options, offset }
        );
    }

    fetchList(): Promise<Array<RowTypeOf<TProjection>>> {
        throw new Error();
    }
}