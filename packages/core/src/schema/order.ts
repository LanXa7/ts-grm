import { AnyModel } from "@/schema/model";
import { OrderedKeys } from "./model_internal_types";

export type ModelOrder<TModel extends AnyModel> = 
    OrderedKeys<TModel> 
    | {
        readonly path: OrderedKeys<TModel>;
        readonly desc?: boolean;
        readonly nulls?: OrderNullsType;
    };

export type OrderNullsType = "UNSPECIFIED" | "FIRST" | "LAST";