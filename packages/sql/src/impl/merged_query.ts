import { ast, BaseQuery, BaseQueryMapOf, RootQuery, RootQueryProjection, RowTypeOf } from "@ts-grm/core";
import { AbstractBaseQueryImpl } from "./abstract_base_query_impl";
import { AbstractDtSubQueryImpl, AbstractExprSubQueryImpl, AbstractNumSubQueryImpl, AbstractStrSubQueryImpl, AbstractTupleSubQueryImpl } from "./abstract_sub_query_impl";

export class MergedRootQueryImpl<
    TProjection extends RootQueryProjection<any>
> implements RootQuery<TProjection>, ast.MergedQueryContract {

    __type(): { rootQuery: TProjection | true; } {
        return { rootQuery: true };
    }
    
    fetchList(): Promise<Array<RowTypeOf<TProjection>>> {
        throw new Error();
    }

    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {}

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}

export class MergedBaseQueryImpl<TProjection>
extends AbstractBaseQueryImpl<TProjection>
implements BaseQuery<TProjection>, ast.MergedQueryContract {

    __type(): { baseQuery: TProjection | true; } {
        return { baseQuery: true };
    }
    
    constructor(
        readonly kind: ast.MergedQueryKind,
        readonly queries: ReadonlyArray<ast.QueryContract>
    ) {
        super();
    }
    
    get args(): BaseQueryMapOf<TProjection> {
        return (this.queries[0]! as any as AbstractBaseQueryImpl<TProjection>).args;
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

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}