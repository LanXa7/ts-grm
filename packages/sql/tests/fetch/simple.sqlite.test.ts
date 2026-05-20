import { describe, it, expect } from "vitest";
import { useSqliteClientWithData } from "./utils";
import { BOOK, BOOK_STORE } from "../model/model";
import { SIMPLE_BOOK_VIEW } from "../query/utils";
import { newSqlRecord } from "../utils";
import { dto } from "@ts-grm/core";

describe.sequential("SimpleSqliteFetchTest", () => {

    const sqlRecord = newSqlRecord();
    
    const sqlClient = useSqliteClientWithData(sqlRecord);
    
    it("alone", async() => {
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

    it("o2m", async () => {
        const VIEW = dto.view(BOOK_STORE, $ => $
            .allScalars()
            .books($ => $
                .id
                .name
                .edition
            )
        );
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.orderBy(store.name);
            return q.select(
                store.fetch(VIEW)
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME,
                        tb_1_.VERSION
                    from BOOK_STORE tb_1_
                    order by 
                        tb_1_.NAME asc
                `,
                args: []
            },
            {
                sql: `
                    select 
                        tb_1_.STORE_ID,
                        tb_1_.ID,
                        tb_1_.NAME,
                        tb_1_.EDITION
                    from BOOK tb_1_
                    where 
                        tb_1_.STORE_ID in(?, ?)
                    order by 
                        tb_1_.NAME asc,
                        tb_1_.EDITION desc
                `,
                args: [2, 1]
            }
        );
        expect(rows).toEqual([
            {
                "id": 2,
                "name": "MANNING",
                "version": 1,
                "books": [
                    {
                        "id": 12,
                        "name": "GraphQL in Action",
                        "edition": 3
                    },
                    {
                        "id": 11,
                        "name": "GraphQL in Action",
                        "edition": 2
                    },
                    {
                        "id": 10,
                        "name": "GraphQL in Action",
                        "edition": 1
                    }
                ]
            },
            {
                "id": 1,
                "name": "O'REILLY",
                "version": 1,
                "books": [
                    {
                        "id": 6,
                        "name": "Effective TypeScript",
                        "edition": 3
                    },
                    {
                        "id": 5,
                        "name": "Effective TypeScript",
                        "edition": 2
                    },
                    {
                        "id": 4,
                        "name": "Effective TypeScript",
                        "edition": 1
                    },
                    {
                        "id": 3,
                        "name": "Learning GraphQL",
                        "edition": 3
                    },
                    {
                        "id": 2,
                        "name": "Learning GraphQL",
                        "edition": 2
                    },
                    {
                        "id": 1,
                        "name": "Learning GraphQL",
                        "edition": 1
                    },
                    {
                        "id": 9,
                        "name": "YugabyteDB: The Definitive Guide",
                        "edition": 3
                    },
                    {
                        "id": 8,
                        "name": "YugabyteDB: The Definitive Guide",
                        "edition": 2
                    },
                    {
                        "id": 7,
                        "name": "YugabyteDB: The Definitive Guide",
                        "edition": 1
                    }
                ]
            }
        ]);
    });
});