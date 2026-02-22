import { BaseQueryProjection, BaseQuerySelectMapArgs, metadata, MutableBaseQuery } from "@ts-grm/core";
import { AbstractMutableQuery } from "./abstract_mutable_query";
import { MapBaseQueryProjection } from "./query_projection";

export class MutableBaseQueryImpl extends AbstractMutableQuery implements MutableBaseQuery {

    __type(): { mutableBaseQuery: true } {
        return { mutableBaseQuery: true }
    }

    constructor(
        tables: ReadonlyArray<metadata.AbstractTable>
    ) {
        super(tables);
    }

    select<
        const TSelectionMap extends BaseQuerySelectMapArgs
    >(
        selectionMap: TSelectionMap
    ): BaseQueryProjection<TSelectionMap> {
        return new MapBaseQueryProjection(selectionMap);
    }
}