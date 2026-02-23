import { BaseQuerySelectMapArgs } from "@/dsl";
import { BaseModelImplementor } from "./base_query_implementor";
import { AbstractEntityTable } from "./entity_table";
import { AbstractExpr } from "./ast";
import { getInternalFactory } from "./ast/internal_factory";

export type ShadowAnchor = {

    readonly baseModel: BaseModelImplementor<any>;

    readonly exportName: string;
};

export function withShadowAnchor<
    T extends BaseQuerySelectMapArgs
>(
    args: T,
    baseModel: BaseModelImplementor<T>
): T {
    const withAnchorArgs: {[key: string]: any} = {};
    for (const key in args) {
        if (typeof key !== "string") {
            continue;
        }
        const value = args[key];
        const anchor: ShadowAnchor = { baseModel, exportName: key };
        if (value instanceof AbstractEntityTable) {
            const table = value.entity.table(anchor);
            withAnchorArgs[key] = table;
        } else if (value instanceof AbstractExpr) {
            const expr = getInternalFactory().createShadowExpr(value, anchor);
            withAnchorArgs[key] = expr;
        }
    }
    return withAnchorArgs as T;
}