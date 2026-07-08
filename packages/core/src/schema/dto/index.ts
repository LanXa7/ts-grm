import { Prettify, suppressUnused } from "@/utils";
import { View } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { DtoBody, DtoMapping, DtoType } from "./common";

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
    suppressUnused(model);
    suppressUnused(fn);
    throw new Error();
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