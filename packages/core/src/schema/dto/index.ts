import type { DtoMapper } from "@/impl";
import { AnyModel } from "../model";

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