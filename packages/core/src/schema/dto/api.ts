import { dtoMapper, type DtoMapper } from "@/impl/dto_mapper";
import { AnyModel } from "../model";
import { ViewCreator } from "./internal_types";
import { DtoBody, DtoMapping, DtoType } from "./dto_context";
import { AllModelMembers } from "../model_internal_types";
import { createDto, newDtoContext } from "@/impl/dto_context";
import { Entity } from "@/impl/entity";
import { Prettify } from "@/utils";

export class View<TModel extends AnyModel, T> {

    __type(): { view: [TModel, T] | undefined } {
        return { view: undefined };
    };

    constructor(readonly mapper: DtoMapper) {}
}

export type TypeOf<TView> =
    TView extends View<any, infer R>
        ? R
        : never;

export type ReferenceFetchType = 
    "LOAD" | "JOIN";

export const dto = {
    view: viewCreator()
} as const;

function viewCreator(): ViewCreator {
    const fun = newView;
    (fun as any).nullAsUndefined = newViewByNullAsUndefined;
    return fun as ViewCreator;
}

function newView<
    TModel extends AnyModel,
    const TMappings extends ReadonlyArray<
        DtoMapping<TModel>
    >,
>(
    model: TModel,
    fn: DtoBody<TModel, "NULL_VIEW", "ENTITY", AllModelMembers<TModel>, TMappings>
): View<
    TModel, 
    Prettify<DtoType<TMappings>>
> {
    const entity = Entity.of(model);
    const ctx = newDtoContext(entity, false) as any;
    const dto = createDto(ctx, undefined, fn);
    return new View(dtoMapper(dto, false));
}


function newViewByNullAsUndefined<
    TModel extends AnyModel,
    const TMappings extends ReadonlyArray<
        DtoMapping<TModel>
    >,
>(
    model: TModel,
    fn: DtoBody<TModel, "UNDEFINED_VIEW", "ENTITY", AllModelMembers<TModel>, TMappings>
): View<
    TModel, 
    Prettify<DtoType<TMappings>>
> {
    const entity = Entity.of(model);
    const ctx = newDtoContext(entity, false) as any;
    const dto = createDto(ctx, undefined, fn);
    return new View(dtoMapper(dto, true));
}