import { ast, BaseQuery, BaseQueryMapOf, FetchOptions, RootQuery, RootQueryProjection, RowTypeOf, suppressUnused } from "@ts-grm/core";
import { AbstractBaseQueryImpl } from "./abstract_base_query_impl";
import { AbstractDtSubQueryImpl, AbstractExprSubQueryImpl, AbstractNumSubQueryImpl, AbstractStrSubQueryImpl, AbstractTupleSubQueryImpl } from "./abstract_sub_query_impl";
import { SqlClientImplementor } from "@/sql_client";
import { AtomRootQueryImpl } from "./atom_root_query_impl";

export class MergedRootQueryImpl<
    TProjection extends RootQueryProjection<any>
> implements RootQuery<TProjection>, ast.MergedQueryContract {

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
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {}

    get isRecursive(): boolean {
        return false;
    }

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }

    get sqlClient(): SqlClientImplementor {
        const q = this.queries[0] as ast.QueryContract;
        if (q.kind === "ATOM") {
            return (q as AtomRootQueryImpl<any>).mutableQuery.sqlClient;
        }
        return (q as MergedRootQueryImpl<any>).sqlClient;
    }
}

export class MergedBaseQueryImpl<TProjection>
extends AbstractBaseQueryImpl<TProjection>
implements BaseQuery<TProjection>, ast.MergedQueryContract {

    __type(): { baseQuery: TProjection | true; } {
        return { baseQuery: true };
    }

    readonly isRecursive: boolean;
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
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

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedTupleSubQueryImpl
extends AbstractTupleSubQueryImpl
implements ast.MergedQueryContract {
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {
        super();
    }

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedExprSubQueryImpl
extends AbstractExprSubQueryImpl
implements ast.MergedQueryContract {
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {
        super();
    }

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedNumSubQueryImpl
extends AbstractNumSubQueryImpl
implements ast.MergedQueryContract {
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {
        super();
    }

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedStrSubQueryImpl
extends AbstractStrSubQueryImpl
implements ast.MergedQueryContract {
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {
        super();
    }

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedDtSubQueryImpl
extends AbstractDtSubQueryImpl
implements ast.MergedQueryContract {
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {
        super();
    }

    get level(): "SUB" {
        return "SUB";
    }

    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}