import { describe, it, expect } from "vitest";
import { AUTHOR } from "../model/model";
import { dto } from "@ts-grm/core";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";

describe.sequential("TsFormulaTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("fullName", async () => {
        const view = dto.view(AUTHOR, $ => $.fullName);
        const rows = await sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(author.id.in(1, 2));
            return q.select(author.fetch(view));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.FIRST_NAME,
                    tb_1_.LAST_NAME
                from AUTHOR tb_1_
                where 
                    tb_1_.ID in(?, ?)
            `,
            args: [1, 2],
            purpose: "query"
        });
        expect(rows).toEqual([
            {"fullName":"Eve Procello"},
            {"fullName":"Alex Banks"}
        ]);
    })
});