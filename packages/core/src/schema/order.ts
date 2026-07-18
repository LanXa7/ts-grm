import { AnyModel } from "@/schema/model";
import { __OrderedKeys } from "./model_internal_types";

export type ModelOrder<TModel extends AnyModel> = 
    __OrderedKeys<TModel> 
    | {
        readonly path: __OrderedKeys<TModel>;
        readonly desc?: boolean;
        readonly nulls?: OrderNullsType;
    };

export type OrderNullsType = "UNSPECIFIED" | "FIRST" | "LAST";