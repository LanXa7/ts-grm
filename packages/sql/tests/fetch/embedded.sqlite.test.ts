import { describe, it, expect } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";
import { dto } from "@ts-grm/core";
import { ORDER, ORDER_ITEM } from "../model/model";

describe.sequential("EmbeddedSpliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("m2o", async() => {
        const VIEW = dto.view(ORDER_ITEM, $ => $
            .allScalars()
            .order()
        );
        const rows = await sqlClient.createQuery(ORDER_ITEM, (q, orderItem) => {
            q.where(orderItem.id.in(1, 2, 3, 4));
            return q.select(
                orderItem.fetch(VIEW)
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.PRODUCT_NAME,
                        tb_1_.order_x,
                        tb_1_.order_y_a,
                        tb_1_.order_y_b
                    from ORDER_ITEM tb_1_
                    where 
                        tb_1_.ID in(?, ?, ?, ?)
                `,
                args: [1, 2, 3, 4],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.X,
                        tb_1_.A,
                        tb_1_.B,
                        tb_1_.X,
                        tb_1_.A,
                        tb_1_.B,
                        tb_1_.NAME
                    from "ORDER" tb_1_
                    where 
                        (
                            tb_1_.X,
                            tb_1_.A,
                            tb_1_.B
                        ) in(
                            (
                                ?,
                                ?,
                                ?
                            ),
                            (
                                ?,
                                ?,
                                ?
                            )
                        )
                `,
                args: [1, 1, 1, 1, 1, 2],
                purpose: "loadAssociation(OrderItem.order)"
            }
        );
        expect(rows).toEqual([
            {
                "id": 1,
                "productName": "Pen",
                "order": {
                    "id": {
                        "x": 1,
                        "y": {
                            "a": 1,
                            "b": 1
                        }
                    },
                    "name": "order-1"
                }
            },
            {
                "id": 2,
                "productName": "Pencil",
                "order": {
                    "id": {
                        "x": 1,
                        "y": {
                            "a": 1,
                            "b": 1
                        }
                    },
                    "name": "order-1"
                }
            },
            {
                "id": 3,
                "productName": "Panio",
                "order": {
                    "id": {
                        "x": 1,
                        "y": {
                            "a": 1,
                            "b": 2
                        }
                    },
                    "name": "order-2"
                }
            },
            {
                "id": 4,
                "productName": "Bike",
                "order": {
                    "id": {
                        "x": 1,
                        "y": {
                            "a": 1,
                            "b": 2
                        }
                    },
                    "name": "order-2"
                }
            }
        ]);
    });

    it("o2m", async() => {
        const VIEW = dto.view(ORDER, $ => $
            .allScalars()
            .items()
        );
        const rows = await sqlClient.createQuery(ORDER, (q, order) => {
            q.where(order.id().x.eq(2));
            return q.select(
                order.fetch(VIEW)
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.X,
                        tb_1_.A,
                        tb_1_.B,
                        tb_1_.NAME
                    from "ORDER" tb_1_
                    where 
                        tb_1_.X = ?
                `,
                args: [2],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.order_x,
                        tb_1_.order_y_a,
                        tb_1_.order_y_b,
                        tb_1_.ID,
                        tb_1_.PRODUCT_NAME
                    from ORDER_ITEM tb_1_
                    where 
                        (
                            tb_1_.order_x,
                            tb_1_.order_y_a,
                            tb_1_.order_y_b
                        ) in(
                            (
                                ?,
                                ?,
                                ?
                            ),
                            (
                                ?,
                                ?,
                                ?
                            )
                        )
                `,
                args: [2, 1, 1, 2, 1, 2],
                purpose: "loadAssociation(Order.items)"
            }
        );
        expect(rows).toEqual([
            {
                "id": {
                    "x": 2,
                    "y": {
                        "a": 1,
                        "b": 1
                    }
                },
                "name": "order-3",
                "items": [
                    {
                        "id": 5,
                        "productName": "Bag"
                    },
                    {
                        "id": 6,
                        "productName": "TV"
                    }
                ]
            },
            {
                "id": {
                    "x": 2,
                    "y": {
                        "a": 1,
                        "b": 2
                    }
                },
                "name": "order-4",
                "items": [
                    {
                        "id": 7,
                        "productName": "Computer"
                    },
                    {
                        "id": 8,
                        "productName": "iPhone"
                    }
                ]
            }
        ]);
    });
});