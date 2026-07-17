import { BaseQueryMapOf, BaseTable, RecursiveMutableBaseQuery, spi } from "@ts-grm/core";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";

export class RecursiveMutableBaseQueryImpl<TProjection>
extends MutableBaseQueryImpl 
implements RecursiveMutableBaseQuery<TProjection> {

    __type(): {
        mutableBaseQuery: true;
        recursiveBaseQuery: TProjection | true;
    } {
        return { 
            mutableBaseQuery: true,
            recursiveBaseQuery: true
        };
    }

    constructor(
        readonly prev: BaseTable<BaseQueryMapOf<TProjection>>,
        tables: ReadonlyArray<spi.AbstractTable>
    ) {
        super(tables);
    }
}