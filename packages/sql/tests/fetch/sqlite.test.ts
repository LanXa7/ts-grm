import { describe, it, expect } from "vitest";
import { useSqliteClientWithData } from "./utils";
import { BOOK } from "../model/model";
import { SIMPLE_BOOK_VIEW } from "../query/utils";
import { newSqlRecord } from "../utils";

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

    });
});