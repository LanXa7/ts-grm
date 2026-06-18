import { describe, it, expect } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";
import { dto } from "@ts-grm/core";
import { BOOK } from "../model/model";

describe.sequential("SqlFormulaTest", () => {

    const sqlRecord = newSqlRecord();
    
    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("test", async() => {
        const view = dto.view(BOOK, $ => $
            .name
            .authorCount
        );
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.edition.eq(3));
            q.orderBy(book.name);
            return q.select(
                book.fetch(view)
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        (
                            select 
                                count(1)
                            from book_author_mapping tb_2_
                            where 
                                tb_2_.book_id = tb_1_.ID
                        )
                    from BOOK tb_1_
                    where 
                        tb_1_.EDITION = ?
                    order by 
                        tb_1_.NAME asc
                `,
                args: [3],
                purpose: "query"
            }
        );
        expect(rows).toEqual([
            { name: 'Effective TypeScript', authorCount: 1 },
            { name: 'GraphQL in Action', authorCount: 1 },
            { name: 'Learning GraphQL', authorCount: 2 },
            { name: 'YugabyteDB: The Definitive Guide', authorCount: 3 }
        ]);
    });
});