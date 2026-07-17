import { AnyModel, EntityTable, Predicate, spi } from "@ts-grm/core";

export interface Filter<TModel extends AnyModel> {

    (table: EntityTable<TModel>): Predicate | undefined;
}

export type AnyFilter = Filter<AnyModel>;

export class FilterManager {

    private _filterMap: Map<spi.Entity, Array<AnyFilter>> | undefined = undefined;

    add<TModel extends AnyModel>(
        model: TModel,
        filter: Filter<TModel> | undefined
    ): this {
        if (filter == null) {
            return this;
        }
        const entity = spi.Entity.of(model);
        let filterMap = this._filterMap;
        if (filterMap == null) {
            this._filterMap = filterMap = new Map();
        }
        let filters = filterMap.get(entity);
        if (filters == null) {
            filters = [];
            filterMap.set(entity, filters);
        }
        filters.push(filter as any as AnyFilter);
        return this;
    }

    // @ts-ignore
    private _toMap(): ReadonlyMap<spi.Entity, ReadonlyArray<AnyFilter>> | undefined {
        return new Map(this._filterMap);
    }
}