import { describe, it, expect } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";
import { dto } from "@ts-grm/core";
import { BOOK_STORE } from "../model/model";

describe.sequential("CalculatorTest", async() => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("targetCalculator", async () => {
        const view = dto.view(BOOK_STORE, $ => $
            .name
            .newestBooks($ => $.name.edition.price)
        );
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            return q.select(
                store.fetch(view)
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        tb_1_.ID
                    from BOOK_STORE tb_1_
                `,
                args: [],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.STORE_ID,
                        tb_1_.NAME,
                        tb_1_.EDITION,
                        tb_1_.PRICE
                    from BOOK tb_1_
                    where 
                        (tb_1_.NAME, tb_1_.EDITION) in(
                            select 
                                tb_2_.NAME,
                                max(tb_2_.EDITION)
                            from BOOK tb_2_
                            where 
                                tb_2_.STORE_ID in(?, ?)
                            group by 
                                tb_2_.NAME
                        )
                `,
                args: [1, 2],
                purpose: "loadCalculator(BookStore.newestBooks)"
            }
        );
        expect(rows).toEqual([
            {
                "name": "O'REILLY",
                "newestBooks": [
                    {
                        "name": "Effective TypeScript",
                        "edition": 3,
                        "price": 63.99
                    },
                    {
                        "name": "Learning GraphQL",
                        "edition": 3,
                        "price": 33.99
                    },
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "edition": 3,
                        "price": 89.99
                    }
                ]
            },
            {
                "name": "MANNING",
                "newestBooks": [
                    {
                        "name": "GraphQL in Action",
                        "edition": 3,
                        "price": 79.99
                    }
                ]
            }
        ]);
    });
});