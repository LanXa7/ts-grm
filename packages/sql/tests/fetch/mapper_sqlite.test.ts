import { describe, expect, it } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";
import { dto } from "@ts-grm/core";
import { AUTHOR, BOOK } from "../model/model";
import z from "zod";

describe("ScalarSqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("oneOutputMapper", async() => {
        const view = dto.view(BOOK, c => [
            c.name.output(
                z.string(), 
                value => value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
            ),
            c.edition
        ]);
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.edition.eq(3));
            q.orderBy(book.name);
            return q.select(book.fetch(view));
        }).fetchList();
        expect(rows).toEqual([
            {
                "name": "Ef****************pt",
                "edition": 3
            },
            {
                "name": "Gr*************on",
                "edition": 3
            },
            {
                "name": "Le************QL",
                "edition": 3
            },
            {
                "name": "Yu****************************de",
                "edition": 3
            }
        ]);
    });

    it("twoOutputMappers", async () => {
        const view = dto.view(AUTHOR, c => [
            c.name,
            c.gender.output(z.enum(["Boy", "Girl"]), gender => {
                return gender === "MALE" ? "Boy" : "Girl";
            })
        ]);
        const rows = await sqlClient.createQuery(AUTHOR, (q, author) => {
            q.orderBy(author.name().firstName, author.name().lastName);
            return q.select(author.fetch(view));
        }).fetchList();
        sqlRecord.assert({
            sql: `
                select 
                    tb_1_.FIRST_NAME,
                    tb_1_.LAST_NAME,
                    tb_1_.GENDER
                from AUTHOR tb_1_
                order by 
                    tb_1_.FIRST_NAME asc,
                    tb_1_.LAST_NAME asc
            `,
            args: [],
            purpose: "query"
        });
        expect(rows).toEqual([
            {
                "name": {
                    "firstName": "Alex",
                    "lastName": "Banks"
                },
                "gender": "Boy"
            },
            {
                "name": {
                    "firstName": "Dan",
                    "lastName": "Vanderkam"
                },
                "gender": "Boy"
            },
            {
                "name": {
                    "firstName": "Eve",
                    "lastName": "Procello"
                },
                "gender": "Girl"
            },
            {
                "name": {
                    "firstName": "Kannappan",
                    "lastName": "Muthukkaruppan"
                },
                "gender": "Boy"
            },
            {
                "name": {
                    "firstName": "Karthik",
                    "lastName": "Ranganathan"
                },
                "gender": "Boy"
            },
            {
                "name": {
                    "firstName": "Mikhail",
                    "lastName": "Bautin"
                },
                "gender": "Boy"
            },
            {
                "name": {
                    "firstName": "Samer",
                    "lastName": "Buna"
                },
                "gender": "Boy"
            }
        ]);
    });
});