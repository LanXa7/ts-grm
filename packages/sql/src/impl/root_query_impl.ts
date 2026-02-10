import type { RootQuery, RootQueryProjection, RowTypeOf } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AbstractRootQueryProjection } from "./root_query_projection";

export class RootQueryImpl<TProjection extends RootQueryProjection<any>> 
implements RootQuery<TProjection> {

    private readonly options: RootQueryOptions;

    constructor(
        private readonly mutableQuery: MutableRootQueryImpl,
        private readonly projection: AbstractRootQueryProjection<any>,
        options: RootQueryOptions | undefined
    ) {
        this.options = options ?? defaultRootQueryOptions;
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

type RootQueryOptions = {
    distinct: boolean;
    limit: number;
    offset: number;
}

const defaultRootQueryOptions: RootQueryOptions = {
    distinct: false,
    limit: -1,
    offset: 0
};