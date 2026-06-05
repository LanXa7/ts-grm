import { BaseQuerySelectMapArgs, ExpressionLike } from "@/dsl";
import { BaseModelImplementor } from "./base_query_implementor";
import { AbstractEntityTable } from "./entity_table";
import { AbstractExpr } from "./ast";
import { getInternalFactory } from "./ast/internal_factory";
import { TableLike } from "@/dsl/table";
import { StateError } from "@/error/common";

export type ShadowAnchor = {

    readonly baseModel: BaseModelImplementor<any>;

    readonly exportedName: string;

    readonly original: ExpressionLike | TableLike;
};

export function withShadowAnchor<
    T extends BaseQuerySelectMapArgs
>(
    args: T,
    baseModel: BaseModelImplementor<T>
): T {
    const withAnchorArgs: {[key: string]: ExpressionLike | TableLike } = {};
    for (const key in args) {
        if (typeof key !== "string") {
            continue;
        }
        const value = args[key];
        const anchor: ShadowAnchor = { baseModel, exportedName: key, original: value as any };
        if (value instanceof AbstractEntityTable) {
            if (value.__anchor != null) {
                // Current technical limitations
                throw new StateError(`The table exported by another base query cannot be exported again`);
            }
            const table = value.__entity.table(anchor);
            withAnchorArgs[key] = table;
        } else if (value instanceof AbstractExpr) {
            const expr = getInternalFactory().createShadowExpr(anchor);
            withAnchorArgs[key] = expr;
        }
    }
    return withAnchorArgs as T;
}