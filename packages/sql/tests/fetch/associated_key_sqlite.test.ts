import { describe, it, expect } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";
import { BOOK, ORDER_ITEM } from "../model/model";
import { dto } from "@ts-grm/core";

describe("AssociatedKeySqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("referenceKey", async() => {
        const view = dto.view(BOOK, c => [
            c.id,
            c.name,
            c.storeId
        ]);
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.edition.eq(3));
            q.orderBy(book.name);
            return q.select(book.fetch(view));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.NAME,
                    tb_1_.STORE_ID
                from BOOK tb_1_
                where 
                    tb_1_.EDITION = ?
                order by 
                    tb_1_.NAME asc
            `,
            args: [3],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 6,
                "name": "Effective TypeScript",
                "storeId": 1
            },
            {
                "id": 12,
                "name": "GraphQL in Action",
                "storeId": 2
            },
            {
                "id": 3,
                "name": "Learning GraphQL",
                "storeId": 1
            },
            {
                "id": 9,
                "name": "YugabyteDB: The Definitive Guide",
                "storeId": 1
            }
        ]);
    });

    it("embeddedKey", async() => {
        const view = dto.view(ORDER_ITEM, c => [
            c.id,
            c.orderId
        ]);
        const row = await sqlClient.createQuery(ORDER_ITEM, (q, item) => {
            q.where(item.id.eq(8));
            return q.select(item.fetch(view));
        }).fetchRequired();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.order_x,
                    tb_1_.order_y_a,
                    tb_1_.order_y_b
                from ORDER_ITEM tb_1_
                where 
                    tb_1_.ID = ?
                limit ?
            `,
            args: [8, 2],
            purpose: "query"
        });
        expect(row).toEqual({
            id: 8, 
            orderId: { 
                x: 2, 
                y: { a: 1, b: 2 } 
            } 
        });
    });

    it("embeddedKeyWithBody", async() => {
        const view = dto.view(ORDER_ITEM, c => [
            c.id,
            c.orderId.with(c => [
                c.x,
                c.$flat("y").prefix("").with(c => [
                    c.b
                ])
            ])
        ]);
        const row = await sqlClient.createQuery(ORDER_ITEM, (q, item) => {
            q.where(item.id.eq(8));
            return q.select(item.fetch(view));
        }).fetchRequired();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.order_x,
                    tb_1_.order_y_b
                from ORDER_ITEM tb_1_
                where 
                    tb_1_.ID = ?
                limit ?
            `,
            args: [8, 2],
            purpose: "query"
        });
        expect(row).toEqual({
            id: 8, 
            orderId: { 
                x: 2, 
                b: 2
            } 
        });
    });
});