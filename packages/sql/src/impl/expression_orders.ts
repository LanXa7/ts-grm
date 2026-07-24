import { ExpressionOrder, ModelOrder, spi } from "@ts-grm/core";

export function toExpressionOrders(
    table: spi.AbstractEntityTable,
    orders: ModelOrder<any> | ReadonlyArray<ModelOrder<any>>
) {
    const propOrders = spi.toEntityPropOrders(
        table.__entity,
        Array.isArray(orders)
            ? orders
            : [orders]
    );
    return propOrders.map(order => {
        return new ExpressionOrder(
            (table as any as spi.AbstractEntityTable).__expression(order.prop),
            order.desc,
            order.nulls
        );
    });
}