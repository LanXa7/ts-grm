import { Prettify } from "@/utils";
import { View } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { DtoBody, DtoMapping, DtoType } from "./dto_context";
import { Entity } from "@/impl";
import { createDto, createDtoContext } from "@/impl/dto_context";
import { dtoMapper } from "@/impl/dto_mapper";

export function newView<
    TModel extends AnyModel,
    const TMappings extends ReadonlyArray<
        DtoMapping<TModel>
    >
>(
    model: TModel,
    fn: DtoBody<TModel, "NULL_VIEW", "ENTITY", AllModelMembers<TModel>, TMappings>
): View<
    TModel, 
    Prettify<DtoType<TMappings>>
> {
    const entity = Entity.of(model);
    const ctx = createDtoContext(entity) as any;
    const dto = createDto(ctx, undefined, fn);
    return new View(dtoMapper(dto, false));
}

/*
type ContainsNullOrUndefined<T> = 
    null extends T ? true : 
    undefined extends T ? true : 
    false;

type OptionalKeys<T> = {
    [K in keyof T]: ContainsNullOrUndefined<T[K]> extends true ? K : never;
}[keyof T];

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

type ToOptional<T> = 
    Partial<Pick<T, OptionalKeys<T>>> & 
    Pick<T, RequiredKeys<T>>;
 */