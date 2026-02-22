import { ast, BaseQuery, BaseQueryMapOf, RootQuery, RootQueryProjection, RowTypeOf } from "@ts-grm/core";
import { AbstractBaseQueryImpl } from "./abstract_base_query_impl";

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
    
    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }

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
    
    get projection(): ast.ProjectionContract {
        return this.queries[0]!.projection;
    }
    
    get args(): BaseQueryMapOf<TProjection> {
        throw new Error("Unsupported function args()");
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitMergedQuery(this);
    }
}