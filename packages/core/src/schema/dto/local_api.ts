import { Prettify } from "@/utils";
import { AllModelMembers, AnyModel } from "../model";
import { DtoBody, DtoMapping, DtoType } from "./dto_context";
import { Entity } from "@/impl";
import { createDto, newDtoContext } from "@/impl/dto_context";
import { dtoMapper } from "@/impl/dto_mapper";
import { View } from "./global_api";

export const view = viewCreator();

export type ViewCreator = {
    
    <
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
    >;

    nullAsUndefined<
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
    >;
};

export type ModelOf<T> =
    T extends View<infer R, any>
        ? R
        : never;

export type ViewNullType = "NULL" | "UNDEFINED";

export function newView<
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

export function newViewByNullAsUndefined<
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

function viewCreator(): ViewCreator {
    const fun = newView;
    (fun as any).nullAsUndefined = newViewByNullAsUndefined;
    return fun as ViewCreator;
}
