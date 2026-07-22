import { dto } from "@ts-grm/core";
import { describe, expect, it } from "vitest";
import { BOOK } from "../model/model";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";

describe.sequential("PageSqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("page1OnAtom", async() => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.store.with(c => [c.name]),
            c.authors.with(c => [c.name])
        ]);
        const q = sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.edition.eq(3));
            q.orderBy(book.name);
            return q.select(book.fetch(view));
        });
        const page = await q.fetchPage({
            pageSize: 3
        });
        sqlRecord.assert(
            {
                sql: `
                    select 
                        count(1)
                    from BOOK tb_1_
                    where 
                        tb_1_.EDITION = ?
                    order by 
                        tb_1_.NAME asc
                `,
                args: [3],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        tb_1_.STORE_ID,
                        tb_1_.ID
                    from BOOK tb_1_
                    where 
                        tb_1_.EDITION = ?
                    order by 
                        tb_1_.NAME asc
                    limit ?
                    offset ?
                `,
                args: [3, 3, 0],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME
                    from BOOK_STORE tb_1_
                    where 
                        tb_1_.ID in(?, ?)
                `,
                args: [1, 2],
                purpose: "loadAssociation(Book.store)"
            },
            {
                sql: `
                    select 
                        tb_2_.book_id,
                        tb_1_.FIRST_NAME,
                        tb_1_.LAST_NAME
                    from AUTHOR tb_1_
                    inner join book_author_mapping tb_2_ on 
                        tb_1_.ID = tb_2_.author_id
                    where 
                        tb_2_.book_id in(?, ?, ?)
                    order by 
                        tb_1_.FIRST_NAME asc,
                        tb_1_.LAST_NAME asc
                `,
                args: [6, 12, 3],
                purpose: "loadAssociation(Book.authors)"
            }
        );
        expect(page).toEqual({
            "totalRowCount": 4,
            "totalPageCount": 2,
            "pageNo": 1,
            "isFirstPage": true,
            "isLastPage": false,
            "rows": [
                {
                    "name": "Effective TypeScript",
                    "store": {
                        "name": "O'REILLY"
                    },
                    "authors": [
                        {
                            "name": {
                                "firstName": "Dan",
                                "lastName": "Vanderkam"
                            }
                        }
                    ]
                },
                {
                    "name": "GraphQL in Action",
                    "store": {
                        "name": "MANNING"
                    },
                    "authors": [
                        {
                            "name": {
                                "firstName": "Samer",
                                "lastName": "Buna"
                            }
                        }
                    ]
                },
                {
                    "name": "Learning GraphQL",
                    "store": {
                        "name": "O'REILLY"
                    },
                    "authors": [
                        {
                            "name": {
                                "firstName": "Alex",
                                "lastName": "Banks"
                            }
                        },
                        {
                            "name": {
                                "firstName": "Eve",
                                "lastName": "Procello"
                            }
                        }
                    ]
                }
            ]
        });
    });
});