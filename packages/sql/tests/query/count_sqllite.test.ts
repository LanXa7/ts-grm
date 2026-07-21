import { describe, expect, it } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";
import { BOOK } from "../model/model";
import { dsl, dto } from "@ts-grm/core";

describe.sequential("CountSqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("countOnSingleQuery", async () => {
        const count = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.edition.eq(3));
            return q.select(
                book.fetch(
                    dto.view(BOOK, c => [
                        c.$allScalars,
                        c.authors.with(c => [
                            c.$allScalars
                        ])
                    ])
                )
            );
        }).fetchCount();
        sqlRecord.assert({
            sql: `
                select 
                    count(1)
                from BOOK tb_1_
                where 
                    tb_1_.EDITION = ?
            `,
            args: [3],
            purpose: "query"
        });
        expect(count).toEqual(4);
    });

    it("countOnMaxQuery", async () => {
        const count = await sqlClient.createQuery(BOOK, (q, book) => {
            return q.select(dsl.max(book.edition));
        }).fetchCount();
        sqlRecord.assert({
            sql: `
                select 
                    count(1)
                from (
                    select 
                        max(tb_1_.EDITION)
                    from BOOK tb_1_
                )
            `,
            args: [],
            purpose: "query"
        });
        expect(count).toEqual(1);
    });

    it("countOnGroupQuery", async () => {
        const count = await sqlClient.createQuery(BOOK, (q, book) => {
            q.groupBy(book.edition);
            return q.select(dsl.max(book.name));
        }).fetchCount();
        sqlRecord.assert({
            sql: `
                select 
                    count(1)
                from (
                    select 
                        max(tb_1_.NAME)
                    from BOOK tb_1_
                    group by 
                        tb_1_.EDITION
                )
            `,
            args: [],
            purpose: "query"
        });
        expect(count).toEqual(3);
    });
});