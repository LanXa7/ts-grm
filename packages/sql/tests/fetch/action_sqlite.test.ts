import { dto } from "@ts-grm/core";
import { describe, it, expect } from "vitest";
import { BOOK_STORE } from "../model/model";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";

describe.sequential("ActionSqliteTest", () => {
    
    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("rename", async () => {
        const view = dto.view(BOOK_STORE, $ => $
            .id.$as("bookStoreId")
            .name.$as("bookStoreName")
            .version.$as("bookStoreVersion")
            .books($ => $
                .id.$as("bookId")
                .name.$as("bookName")
                .edition.$as("bookEdition")
                .price.$as("bookPrice")
                .authors($ => $
                    .id.$as("authorId")
                    .name($ => $
                        .firstName.$as("_1")
                        .lastName.$as("_2")
                    ).$as("authorName")
                ).$as("bookAuthors")
            ).$as("bookStoreBooks")
        );
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            q.where(store.id.eq(2));
            return q.select(store.fetch(view));
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME,
                        tb_1_.VERSION
                    from BOOK_STORE tb_1_
                    where 
                        tb_1_.ID = ?
                `,
                args: [2],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.STORE_ID,
                        tb_1_.ID,
                        tb_1_.NAME,
                        tb_1_.EDITION,
                        tb_1_.PRICE
                    from BOOK tb_1_
                    where 
                        tb_1_.STORE_ID = ?
                    order by 
                        tb_1_.NAME asc,
                        tb_1_.EDITION desc
                `,
                args: [2],
                purpose: "loadAssociation(BookStore.books)"
            },
            {
                sql: `
                    select 
                        tb_2_.book_id,
                        tb_1_.ID,
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
                args: [12, 11, 10],
                purpose: "loadAssociation(Book.authors)"
            }
        );
        expect(rows).toEqual([
            {
                "bookStoreId": 2,
                "bookStoreName": "MANNING",
                "bookStoreVersion": 1,
                "bookStoreBooks": [
                    {
                        "bookId": 12,
                        "bookName": "GraphQL in Action",
                        "bookEdition": 3,
                        "bookPrice": 79.99,
                        "bookAuthors": [
                            {
                                "authorId": 7,
                                "authorName": {
                                    "_1": "Samer",
                                    "_2": "Buna"
                                }
                            }
                        ]
                    },
                    {
                        "bookId": 11,
                        "bookName": "GraphQL in Action",
                        "bookEdition": 2,
                        "bookPrice": 69.99,
                        "bookAuthors": [
                            {
                                "authorId": 7,
                                "authorName": {
                                    "_1": "Samer",
                                    "_2": "Buna"
                                }
                            }
                        ]
                    },
                    {
                        "bookId": 10,
                        "bookName": "GraphQL in Action",
                        "bookEdition": 1,
                        "bookPrice": 59.99,
                        "bookAuthors": [
                            {
                                "authorId": 7,
                                "authorName": {
                                    "_1": "Samer",
                                    "_2": "Buna"
                                }
                            }
                        ]
                    }
                ]
            }
        ]);
    });
});