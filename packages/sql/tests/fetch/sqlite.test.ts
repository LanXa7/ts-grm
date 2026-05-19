import { describe, it, expect } from "vitest";
import { useSqliteClientWithData } from "./utils";
import { BOOK } from "../model/model";
import { SIMPLE_BOOK_VIEW } from "../query/utils";
import { newSqlRecord } from "../utils";
import { dto } from "@ts-grm/core";

describe.sequential("SqliteFetchTest", () => {

    const sqlRecord = newSqlRecord();
    
    const sqlClient = useSqliteClientWithData(sqlRecord);
    
    it("simple", async() => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.storeId.eq(2));
            q.orderBy(book.edition.desc())
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW)
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_1_.EDITION
            from BOOK tb_1_
            where 
                tb_1_.STORE_ID = ?
            order by 
                tb_1_.EDITION desc
            `,
            args: [2]
        });
        expect(rows).toEqual([
            {"id":12,"name":"GraphQL in Action","edition":3},
            {"id":11,"name":"GraphQL in Action","edition":2},
            {"id":10,"name":"GraphQL in Action","edition":1}
        ]);
    });

    it("m2o", async() => {
        const VIEW = dto.view(BOOK, $ => $
            .allScalars()
            .store($ => $
                .id
                .name
                .version
            )
        );
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.name.ilike("graphql"));
            q.orderBy(book.name, book.edition.desc());
            return q.select(
                book.fetch(VIEW)
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME,
                        tb_1_.EDITION,
                        tb_1_.PRICE,
                        tb_1_.STORE_ID
                    from BOOK tb_1_
                    where 
                        lower(tb_1_.NAME) like ?
                    order by 
                        tb_1_.NAME asc,
                        tb_1_.EDITION desc
                `,
                args: ["%graphql%"]
            },
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.ID,
                        tb_1_.NAME,
                        tb_1_.VERSION
                    from BOOK_STORE tb_1_
                    where 
                        tb_1_.ID in(?, ?)
                `,
                args: [2, 1]
            }
        );
        expect(rows).toEqual([
            {
                id: 12,
                name: 'GraphQL in Action',
                edition: 3,
                price: 79.99,
                store: { id: 2, name: 'MANNING', version: 1 }
            },
            {
                id: 11,
                name: 'GraphQL in Action',
                edition: 2,
                price: 69.99,
                store: { id: 2, name: 'MANNING', version: 1 }
            },
            {
                id: 10,
                name: 'GraphQL in Action',
                edition: 1,
                price: 59.99,
                store: { id: 2, name: 'MANNING', version: 1 }
            },
            {
                id: 3,
                name: 'Learning GraphQL',
                edition: 3,
                price: 33.99,
                store: { id: 1, name: "O'REILLY", version: 1 }
            },
            {
                id: 2,
                name: 'Learning GraphQL',
                edition: 2,
                price: 33.99,
                store: { id: 1, name: "O'REILLY", version: 1 }
            },
            {
                id: 1,
                name: 'Learning GraphQL',
                edition: 1,
                price: 33.99,
                store: { id: 1, name: "O'REILLY", version: 1 }
            }
        ]);
    });
});