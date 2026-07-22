import { Criteria, Predicate } from "@/dsl";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { AnyModel } from "@/schema/model";
import { suppressUnused } from "@/utils";

export interface CriteriaHandler<TModel extends AnyModel> {

    toPredicate(
        criteria: Criteria<TModel>
    ): Predicate | undefined;
}

export function criteriaHandlerOf<
    TModel extends AnyModel
>(
    model: TModel
): CriteriaHandler<TModel> {
    const entity = Entity.of(model);
    return getCriteriaHandler(entity);
}

const criteriaHandlerMap = new Map<string, CriteriaHandler<any>>();

function getCriteriaHandler(
    source: Entity | EntityProp
): CriteriaHandler<any> {
    const key = source instanceof Entity ? source.name : source.toString();
    let handler = criteriaHandlerMap.get(key);
    if (handler == null) {
        handler = crateCriteriaHandler(source);
        criteriaHandlerMap.set(key, handler);
    }
    return handler;
}

function crateCriteriaHandler(
    source: Entity | EntityProp
): CriteriaHandler<any> {
    suppressUnused(source);
    throw new Error();
}