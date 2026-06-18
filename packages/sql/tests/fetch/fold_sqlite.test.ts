import { dto } from "@ts-grm/core";
import { describe, it, expect } from "vitest";
import { BOOK } from "../model/model";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";

describe.sequential("FoldSqliteTest", () => {

    const sqlRecord = newSqlRecord();
    
    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("fold", async () => {
        const view = dto.view(BOOK, $ => $
            .fold("key", $ => $
                .name
                .edition
            )
            .fold("associations", $ => $
                .store($ => $
                    .id
                    .fold("key", $ => $
                        .name
                        .version
                    )
                )
                .authors($ => $.name())
            )
        );
        const row = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(9));
            return q.select(
                book.fetch(view)
            );
        }).fetchRequired();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        tb_1_.EDITION,
                        tb_1_.STORE_ID,
                        tb_1_.ID
                    from BOOK tb_1_
                    where 
                        tb_1_.ID = ?
                `,
                args: [9],
                purpose: "query"
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
                        tb_1_.ID = ?
                `,
                args: [1],
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
                        tb_2_.book_id = ?
                    order by 
                        tb_1_.FIRST_NAME asc,
                        tb_1_.LAST_NAME asc
                `,
                args: [9],
                purpose: "loadAssociation(Book.authors)"
            }
        );
        expect(row).toEqual({
            "key": {
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 3
            },
            "associations": {
                "store": {
                    "id": 1,
                    "key": {
                        "name": "O'REILLY",
                        "version": 1
                    }
                },
                "authors": [
                    {
                        "name": {
                            "firstName": "Kannappan",
                            "lastName": "Muthukkaruppan"
                        }
                    },
                    {
                        "name": {
                            "firstName": "Karthik",
                            "lastName": "Ranganathan"
                        }
                    },
                    {
                        "name": {
                            "firstName": "Mikhail",
                            "lastName": "Bautin"
                        }
                    }
                ]
            }
        });
    });

    it("foldMixedWithFlat", async () => {
        const view = dto.view(BOOK, $ => $
            .fold("key", $ => $
                .name
                .edition
            )
            .fold("associations", $ => $
                .flat("store", $ => $
                    .id
                    .fold("key", $ => $
                        .name
                        .version
                    )
                )
                .authors($ => $
                    .flat({prop: "name", prefix: ""})
                )
            )
        );
        const row = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(9));
            return q.select(
                book.fetch(view)
            );
        }).fetchRequired();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        tb_1_.EDITION,
                        tb_1_.STORE_ID,
                        tb_1_.ID
                    from BOOK tb_1_
                    where 
                        tb_1_.ID = ?
                `,
                args: [9],
                purpose: "query"
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
                        tb_1_.ID = ?
                `,
                args: [1],
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
                        tb_2_.book_id = ?
                    order by 
                        tb_1_.FIRST_NAME asc,
                        tb_1_.LAST_NAME asc
                `,
                args: [9],
                purpose: "loadAssociation(Book.authors)"
            }
        );
        expect(row).toEqual({
            "key": {
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 3
            },
            "associations": {
                "storeId": 1,
                "storeKey": {
                    "name": "O'REILLY",
                    "version": 1
                },
                "authors": [
                    {
                        "firstName": "Kannappan",
                        "lastName": "Muthukkaruppan"
                    },
                    {
                        "firstName": "Karthik",
                        "lastName": "Ranganathan"
                    },
                    {
                        "firstName": "Mikhail",
                        "lastName": "Bautin"
                    }
                ]
            }
        });
    });
});