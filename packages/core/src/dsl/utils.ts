import { OrderNullsType } from "@/schema/order";
import { ExpressionLike } from ".";

export class ExpressionOrder {
    
    constructor(
        readonly expression: ExpressionLike,
        readonly desc: boolean,
        readonly nullsType: OrderNullsType
    ) {}

    nulls(
        type: OrderNullsType
    ): ExpressionOrder {
        return this.nullsType === type
            ? this
            : new ExpressionOrder(this.expression, this.desc, this.nullsType);
    }
};

export type AtLeastOne<T> = readonly [T, ...T[]];
export type AtLeastTwo<T> = readonly [T, T, ...[]];

export type IsNull<T> = 
    null extends T
        ? true
    : undefined extends T
        ? true
    : false;