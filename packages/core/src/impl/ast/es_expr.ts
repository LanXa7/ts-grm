import { ArgumentError } from "@/error/common";
import { AbstractExpr } from "./expr";
import { getInternalFactory } from "./internal_factory";
import type { CoalesceEsExpr } from "./coalesce_expr";

export abstract class AbstractEsExpr<T extends string> extends AbstractExpr<T> {

    override coalesce(
        values: ReadonlyArray<T | AbstractEsExpr<T>>
    ): CoalesceEsExpr<T> {
        const arr = values.map(value => {
            if (value == null) {
                throw new ArgumentError("coalesce does not accept null/undefined value");
            }
            if (value instanceof AbstractEsExpr) {
                return value;
            }
            return getInternalFactory().createLiteral(value, "AS_ENUM_SET");
        });
        return getInternalFactory().createCoalesceEsExpr(this, arr);
    }

    
}
