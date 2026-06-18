import { describe, it, expect } from "vitest";
import { useSqliteClientWithData } from "../data_utils";
import { newSqlRecord } from "../utils";
import { AUTHOR } from "../model/model";
import { dsl, dto } from "@ts-grm/core";

describe.sequential("ScalarProviderTest", () => {

    const sqlRecord = newSqlRecord();
    
    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("enumEq", async () => {
        const rows = await sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(author.gender.eq("FEMALE"));
            return q.select(
                author.fetch(
                    dto.view(AUTHOR, $ => $.allScalars())
                )
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.FIRST_NAME,
                    tb_1_.LAST_NAME,
                    tb_1_.GENDER
                from AUTHOR tb_1_
                where 
                    tb_1_.GENDER = ?
            `,
            args: ['F'],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 1,
                "name": {
                    "firstName": "Eve",
                    "lastName": "Procello"
                },
                "gender": "FEMALE"
            }
        ]);
    });

    it("enumTupleEq", async () => {
        const rows = await sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(
                dsl.tuple(author.gender, author.name().firstName).eq(["FEMALE", "Eve"]));
            return q.select(
                author.fetch(
                    dto.view(AUTHOR, $ => $.allScalars())
                )
            );
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.ID,
                    tb_1_.FIRST_NAME,
                    tb_1_.LAST_NAME,
                    tb_1_.GENDER
                from AUTHOR tb_1_
                where 
                    (tb_1_.GENDER, tb_1_.FIRST_NAME) = (?, ?)
            `,
            args: ['F', 'Eve'],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "id": 1,
                "name": {
                    "firstName": "Eve",
                    "lastName": "Procello"
                },
                "gender": "FEMALE"
            }
        ]);
    });
});