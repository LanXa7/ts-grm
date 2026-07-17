import { spi, MutableRootQuery, RootQueryProjection, RootQuerySelectArrArgs, RootQuerySelection, RootQuerySelectMapArgs } from "@ts-grm/core";
import { SqlClientImplementor } from "@/sql_client";
import { AbstractRootQueryProjection } from "./query_projection";
import { AbstractMutableQuery } from "./abstract_mutable_query";

export class MutableRootQueryImpl 
extends AbstractMutableQuery 
implements MutableRootQuery {

    __type(): { mutableRootQuery: true; } {
        return { mutableRootQuery: true };
    }

    constructor(
        readonly sqlClient: SqlClientImplementor,
        tables: ReadonlyArray<spi.AbstractTable>
    ) {
        super(tables);
    }

    select<
        const TSelections extends RootQuerySelectArrArgs
    >(
        ...selections: TSelections
    ): RootQueryProjection<{
        [K in keyof TSelections]: 
            TSelections[K] extends RootQuerySelection<infer U> ? RootQuerySelection<U> : never
    }, "ARRAY">;

    select<
        const TSelections extends RootQuerySelectMapArgs
    >(
        selections: TSelections
    ): RootQueryProjection<{
        [K in keyof TSelections]: 
            TSelections[K] extends RootQuerySelection<infer U> ? RootQuerySelection<U> : never
    }, "MAP">;

    select<TSelection extends RootQuerySelection<any>>(
        selection: TSelection
    ) : RootQueryProjection<TSelection, "ONE">;

    select(...arr: any[]): any {
        return AbstractRootQueryProjection.of(arr);
    }
}
