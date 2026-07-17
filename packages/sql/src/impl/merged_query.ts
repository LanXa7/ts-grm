import { spi, BaseQuery, BaseQueryMapOf, FetchOptions, FetchPageOptions, FetchRangeOptions, Page, RootQuery, RootQueryProjection, RowTypeOf, suppressUnused } from "@ts-grm/core";
import { AbstractBaseQueryImpl } from "./abstract_base_query_impl";
import { AbstractDtSubQueryImpl, AbstractExprSubQueryImpl, AbstractNumSubQueryImpl, AbstractStrSubQueryImpl, AbstractTupleSubQueryImpl } from "./abstract_sub_query_impl";
import { SqlClientImplementor } from "@/sql_client";
import { AtomRootQueryImpl } from "./atom_root_query_impl";

export class MergedRootQueryImpl<
    TProjection extends RootQueryProjection<any>
> implements RootQuery<TProjection>, spi.MergedQueryContract {

    __type(): { rootQuery: TProjection | true; } {
        return { rootQuery: true };
    }

    get level(): "ROOT" {
        return "ROOT";
    }
    
    fetchList<TNullAsUndefined extends boolean = false>(
        options?: FetchOptions<TNullAsUndefined>
    ): Promise<Array<RowTypeOf<TProjection, TNullAsUndefined>>> {
        suppressUnused(options);
        throw new Error();
    }

    async fetchRange<
        TNullAsUndefined extends boolean = false
    >(
        options: FetchRangeOptions & FetchOptions<TNullAsUndefined>
    ): Promise<Array<RowTypeOf<TProjection, TNullAsUndefined>>> {
        suppressUnused(options);
        throw new Error();
    }

    async fetchPage<
        TNullAsUndefined extends boolean = false
    >(
        options: FetchPageOptions & FetchOptions<TNullAsUndefined>
    ): Promise<Page<RowTypeOf<TProjection, TNullAsUndefined>>> {
        suppressUnused(options);
        throw new Error();
    }

    fetchRequired<TNullAsUndefined extends boolean = false>(
        options?: FetchOptions<TNullAsUndefined>
    ): Promise<RowTypeOf<TProjection, TNullAsUndefined>> {
        suppressUnused(options);
        throw new Error();
    }

    fetchOptional<TNullAsUndefined extends boolean = false>(
        options?: FetchOptions<TNullAsUndefined>
    ): Promise<
        RowTypeOf<TProjection, TNullAsUndefined> 
        | TNullAsUndefined extends true ? undefined : null
    > {
        suppressUnused(options);
        throw new Error();
    }

    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {}

    get isRecursive(): boolean {
        return false;
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }

    get sqlClient(): SqlClientImplementor {
        const q = this.queries[0] as spi.QueryContract;
        if (q.kind === "ATOM") {
            return (q as AtomRootQueryImpl<any>).mutableQuery.sqlClient;
        }
        return (q as MergedRootQueryImpl<any>).sqlClient;
    }
}

export class MergedBaseQueryImpl<TProjection>
extends AbstractBaseQueryImpl<TProjection>
implements BaseQuery<TProjection>, spi.MergedQueryContract {

    __type(): { baseQuery: TProjection | true; } {
        return { baseQuery: true };
    }

    readonly isRecursive: boolean;
    
    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {
        super();
        let recursive = false;
        for (const query of queries) {
            if (query.isRecursive) {
                recursive = true;
                break;
            } 
        }
        this.isRecursive = recursive;
    }
    
    get args(): BaseQueryMapOf<TProjection> {
        return (this.queries[0]! as any as AbstractBaseQueryImpl<TProjection>).args;
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedTupleSubQueryImpl
extends AbstractTupleSubQueryImpl
implements spi.MergedQueryContract {
    
    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {
        super();
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedExprSubQueryImpl
extends AbstractExprSubQueryImpl
implements spi.MergedQueryContract {
    
    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {
        super();
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedNumSubQueryImpl
extends AbstractNumSubQueryImpl
implements spi.MergedQueryContract {
    
    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {
        super();
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedStrSubQueryImpl
extends AbstractStrSubQueryImpl
implements spi.MergedQueryContract {
    
    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {
        super();
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedDtSubQueryImpl
extends AbstractDtSubQueryImpl
implements spi.MergedQueryContract {
    
    constructor(
        readonly kind: spi.MergedQueryKind,
        readonly queries: ReadonlyArray<spi.QueryContract>
    ) {
        super();
    }

    get level(): "SUB" {
        return "SUB";
    }

    get projection(): spi.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: spi.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}