import { AllModelMembers, AnyModel } from "@/schema/model";
import { ViewBuilder } from "./output_dto";
import { Prettify } from "@/utils";
import { Entity } from "@/impl";
import { createTypedDtoBuilder } from "@/impl/dto_builder";
import { DtoMapper, dtoMapper } from "@/impl/dto_mapper";

export const dto = { view: viewCreator() } as const;

function viewCreator(): ViewCreator {

    const view = <TModel extends AnyModel, X>(
        model: TModel,
        fn: (
            builder: ViewBuilder<TModel, AllModelMembers<TModel>, "NULL", {}, {}, any, any>
        ) => ViewBuilder<TModel, AllModelMembers<TModel>, "NULL", X, any, any, any>
    ): View<TModel, Prettify<X>> => {
        const builder = createTypedDtoBuilder(Entity.of(model));
        fn(builder as any as ViewBuilder<TModel, AllModelMembers<TModel>, "NULL", {}, {}, any, any>);
        const dto = builder.__unwrap().build();
        console.log(JSON.stringify(dto));
        return new View(dtoMapper(dto, false));
    }

    view.nullAsUndefined = <TModel extends AnyModel, X>(
        model: TModel,
        fn: (
            builder: ViewBuilder<TModel, AllModelMembers<TModel>, "UNDEFINED", {}, {}, any, any>
        ) => ViewBuilder<TModel, AllModelMembers<TModel>, "UNDEFINED", X, any, any, any>
    ): View<TModel, Prettify<X>> => {
        const builder = createTypedDtoBuilder(Entity.of(model));
        fn(builder as any as ViewBuilder<TModel, AllModelMembers<TModel>, "NULL", {}, {}, any, any>);
        return new View(dtoMapper(builder.__unwrap().build(), true));
    }

    return view as ViewCreator;
}

export class View<TModel extends AnyModel, T> {

    __type(): { view: [TModel, T] | undefined } {
        return { view: undefined };
    };

    constructor(readonly mapper: DtoMapper) {}
}

export type ViewCreator = {
    
    <TModel extends AnyModel, X>(
        model: TModel,
        fn: (
            builder: ViewBuilder<TModel, AllModelMembers<TModel>, "NULL", {}, {}, any, any>
        ) => ViewBuilder<TModel, AllModelMembers<TModel>, "NULL", X, any, any, any>
    ): View<TModel, Prettify<X>>;

    nullAsUndefined: NullAsUndefinedViewCreator;
};

export type NullAsUndefinedViewCreator = {

    <TModel extends AnyModel, X>(
        model: TModel,
        fn: (
            builder: ViewBuilder<TModel, AllModelMembers<TModel>, "UNDEFINED", {}, {}, any, any>
        ) => ViewBuilder<TModel, AllModelMembers<TModel>, "UNDEFINED", X, any, any, any>
    ): View<TModel, Prettify<X>>;
}

export type ModelOf<T> =
    T extends View<infer R, any>
        ? R
        : never;

export type TypeOf<T> =
    T extends View<any, infer R>
        ? R
        : never;

export type ViewNullType = "NULL" | "UNDEFINED";