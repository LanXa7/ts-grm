import { describe, it } from "vitest";
import { useSqliteClient } from "../utils";
import { dsl } from "@ts-grm/core";
import { BOOK } from "../model/model";
import { sql } from "./utils";

describe.sequential("BaseQueryTest", () => {

    const sqlClient = useSqliteClient();

    it("deepBaseQuery", () => {
        const map: any = {};
        const bm1 = dsl.derivedModel(
            dsl.baseQuery(BOOK, (q, book) => {
                q.where(book.id.eq(12))
                return q.select({
                    a: book.id,
                    b: book.name,
                    c: book.edition,
                    d: book
                });
            })
        );
        const bm2 = dsl.derivedModel(
            dsl.baseQuery(bm1, (q, base) => {
                map.a = base.a;
                map.b = base.b;
                map.c = base.c;
                map.d = base.d;
                return q.select({
                    A: base.c,
                    B: base.b,
                    C: base.a,
                    D: base.d,
                    E: dsl.native.num `row_numer() over(order by ${base.a} desc)`
                });
            })
        );
        const q = sqlClient.createQuery(bm2, (q, base) => {
            map.A = base.A;
            map.B = base.B;
            map.C = base.C;
            map.D = base.D;
            map.Outer = base;
            return q.select(base.A, base.B, base.C, base.D.id, base.D.name, base.E);
        });
        console.log(sql(q));
    });
});