import { Column, Composite, Fragment, Query, Scope, Separator, Value } from "@/sql/fragment";
import { Entity } from "@ts-grm/core";
import { BOOK } from "../model/model";
import { describe, expect, it } from "vitest";
import { AstContext } from "@/sql/ast_context";
import { SqlBuilder } from "@/sql/sql_builder";
import { expectCode } from "../utils";

describe("FragmentTest", () => {

    it("simple", () => {
        const ctx = new AstContext();
        const query = new Query(
            [ctx.toRealTable(bookTable)],
            composite(
                new Scope("COMMA"),
                composite(
                    new Scope("INDENT"),
                    new Column(ctx.toRealTable(bookTable), "EDITION"),
                    " = ",
                    new Value(3),
                    Separator.AND,
                    new Column(
                        ctx.toRealTable((bookTable as any).store()), 
                        "NAME"
                    ),
                    " = ",
                    new Value("O'REILLY"),
                ),
            ),
            undefined,
            undefined,
            undefined,
            composite(
                new Scope("COMMA"),
                new Column(ctx.toRealTable(bookTable), "ID"),
                Separator.COMMA,
                new Column(ctx.toRealTable(bookTable), "NAME"),
                Separator.COMMA,
                new Column(ctx.toRealTable((bookTable as any).store()), "ID"),
                Separator.COMMA,
                new Column(ctx.toRealTable((bookTable as any).store()), "NAME"),
            )
        );
        expectCode(sql(query, true), `
            select 
                tb_1_.ID,
                tb_1_.NAME,
                tb_2_.ID,
                tb_2_.NAME
            from tb_1_
            inner join tb_2_
            where
                    tb_1_.EDITION = @p1
                and
                    tb_2_.NAME = @p2`
        );
        expect(sql(query, false)).toEqual(
            "select tb_1_.ID, tb_1_.NAME, tb_2_.ID, tb_2_.NAME " + 
            "from tb_1_ inner join tb_2_ " + 
            "where tb_1_.EDITION = @p1 and tb_2_.NAME = @p2"
        );
    });

    const bookTable = Entity.of(BOOK).table(undefined);

    function composite<C extends Composite>(
        composite: C, 
        ...args: ReadonlyArray<string | Fragment>
    ): C {
        for (const arg of args) {
            if (typeof arg === "string") {
                composite.text(arg);
            } else {
                composite.add(arg);
            }
        }
        return composite;
    }

    function sql(fragment: Fragment, pretty: boolean) {
        const builder = new SqlBuilder(pretty, "@", true);
        fragment.into(builder);
        const [sql] = builder.build();
        return sql;
    }
});