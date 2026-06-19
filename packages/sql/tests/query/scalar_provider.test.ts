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
                dsl.tuple(author.name().firstName, author.gender).eq(["Eve", "FEMALE"])
            );
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
                    (tb_1_.FIRST_NAME, tb_1_.GENDER) = (?, ?)
            `,
            args: ['Eve', 'F'],
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

    it("enumIn", async() => {
        const rows = await sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(
                author.gender.in("MALE", "FEMALE")
            );
            return q.select(
                author.fetch(
                    dto.view(AUTHOR, $ => $.allScalars())
                )
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.FIRST_NAME,
                        tb_1_.LAST_NAME,
                        tb_1_.GENDER
                    from AUTHOR tb_1_
                    where 
                        tb_1_.GENDER in(?, ?)
                `,
                args: ['M', 'F'],
                purpose: "query"
            }
        );
        expect(rows).toEqual([
            {
                "id": 1,
                "name": {
                    "firstName": "Eve",
                    "lastName": "Procello"
                },
                "gender": "FEMALE"
            },
            {
                "id": 2,
                "name": {
                    "firstName": "Alex",
                    "lastName": "Banks"
                },
                "gender": "MALE"
            },
            {
                "id": 3,
                "name": {
                    "firstName": "Dan",
                    "lastName": "Vanderkam"
                },
                "gender": "MALE"
            },
            {
                "id": 4,
                "name": {
                    "firstName": "Karthik",
                    "lastName": "Ranganathan"
                },
                "gender": "MALE"
            },
            {
                "id": 5,
                "name": {
                    "firstName": "Kannappan",
                    "lastName": "Muthukkaruppan"
                },
                "gender": "MALE"
            },
            {
                "id": 6,
                "name": {
                    "firstName": "Mikhail",
                    "lastName": "Bautin"
                },
                "gender": "MALE"
            },
            {
                "id": 7,
                "name": {
                    "firstName": "Samer",
                    "lastName": "Buna"
                },
                "gender": "MALE"
            }
        ]);
    });

    it("enumTupleIn", async() => {
        const rows = await sqlClient.createQuery(AUTHOR, (q, author) => {
            q.where(
                dsl.tuple(author.name().firstName, author.gender).in(
                    ["Eve", "FEMALE"],
                    ["Alex", "MALE"]
                )
            );
            return q.select(
                author.fetch(
                    dto.view(AUTHOR, $ => $.allScalars())
                )
            );
        }).fetchList();
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.FIRST_NAME,
                        tb_1_.LAST_NAME,
                        tb_1_.GENDER
                    from AUTHOR tb_1_
                    where 
                        (tb_1_.FIRST_NAME, tb_1_.GENDER) in(
                            (?, ?),
                            (?, ?)
                        )
                `,
                args: ['Eve', 'F', 'Alex', 'M'],
                purpose: "query"
            }
        );
        expect(rows).toEqual([
            {
                "id": 1,
                "name": {
                    "firstName": "Eve",
                    "lastName": "Procello"
                },
                "gender": "FEMALE"
            },
            {
                "id": 2,
                "name": {
                    "firstName": "Alex",
                    "lastName": "Banks"
                },
                "gender": "MALE"
            }
        ]);
    });
});