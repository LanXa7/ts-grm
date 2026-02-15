import { Column, Composite, ExportedTable, Fragment, Query, Scope, Separator, Value } from "@/sql/fragment";
import { metadata } from "@ts-grm/core";
import { AUTHOR, BOOK } from "../model/model";
import { describe, expect, it } from "vitest";
import { AstContext } from "@/sql/ast_context";
import { SqlBuilder } from "@/sql/sql_builder";
import { expectCode } from "../utils";
import { RealTable } from "@/sql/real_table";

describe("FragmentTest", () => {

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

    function shadow(table: metadata.AbstractEntityTable, shadow: metadata.AbstractEntityTable) {
        table.__setShadow(shadow);
        return table;
    }

    function sql(fragment: Fragment, pretty: boolean) {
        const builder = new SqlBuilder(pretty, "@", true);
        fragment.into(builder);
        const [sql] = builder.build();
        return sql;
    }

    it("simple", () => {
        const bookTable = metadata.Entity.of(BOOK).table(undefined);
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
            from  tb_1_
            inner join  tb_2_
            where
                    tb_1_.EDITION = @p1
                and
                    tb_2_.NAME = @p2`
        );
        expect(sql(query, false)).toEqual(
            "select tb_1_.ID, tb_1_.NAME, tb_2_.ID, tb_2_.NAME " + 
            "from  tb_1_ inner join  tb_2_ " + 
            "where tb_1_.EDITION = @p1 and tb_2_.NAME = @p2"
        );
    });

    it("baseQuery", () => {
        const ctx = new AstContext();
        const exportedBookTable = metadata.Entity.of(BOOK).table(true);
        const exportedAuthorTable = metadata.Entity.of(AUTHOR).table(true);
        const bookTable = metadata.Entity.of(BOOK).table(undefined);
        const authorTable = metadata.Entity.of(AUTHOR).table(undefined);
        shadow(bookTable, exportedBookTable);
        shadow(authorTable, exportedAuthorTable);
        const bq1 = new Query(
            [ctx.toRealTable(bookTable)],
            composite(
                new Scope("INDENT"),
                new Column(ctx.toRealTable(bookTable), "EDITION"),
                " = ",
                new Value(3)
            ),
            undefined,
            undefined,
            undefined,
            composite(
                new Scope("COMMA"),
                new ExportedTable(ctx.toRealTable(bookTable)),
                Separator.COMMA,
                new ExportedTable(
                    ctx.toRealTable(
                        shadow((bookTable as any).authors(), exportedAuthorTable)
                    )
                ),
                Separator.COMMA,
                composite(
                    new Composite(),
                    "row_number() over(partition by ",
                    new Column(ctx.toRealTable(bookTable), "STORE_ID"),
                    " order by ",
                    new Column(ctx.toRealTable(bookTable), "PRICE"),
                    " desc)"
                )
            )
        );
        const bq2 = new Query(
            [ctx.toRealTable(authorTable)],
            composite(
                new Scope("INDENT"),
                new Column(ctx.toRealTable(authorTable), "NAME"),
                " ilike ",
                new Value("alex")
            ),
            undefined,
            undefined,
            undefined,
            composite(
                new Scope("COMMA"),
                new ExportedTable(
                    ctx.toRealTable(
                        shadow((authorTable as any).books(), exportedBookTable)
                    )
                ),
                Separator.COMMA,
                new ExportedTable(
                    ctx.toRealTable(authorTable)
                ),
                Separator.COMMA,
                composite(
                    new Composite(),
                    "row_number() over(partition by ",
                    new Column(ctx.toRealTable((authorTable as any).books()), "STORE_ID"),
                    " order by ",
                    new Column(ctx.toRealTable((authorTable as any).books()), "PRICE"),
                    " desc)"
                )
            )
        );
        const realBaseTable = new RealTable(new metadata.BaseTableTarget({}));
        realBaseTable._baseQuery = composite(
            new Scope("UNION_ALL"),
            bq1,
            bq2
        );
        ctx.toRealTable(exportedBookTable)._baseTable = realBaseTable;
        ctx.toRealTable(exportedAuthorTable)._baseTable = realBaseTable;
        const q = new Query(
            [realBaseTable],
            undefined,
            undefined,
            undefined,
            undefined,
            composite(
                new Scope("COMMA"),
                new Column(ctx.toRealTable(exportedBookTable), "ID"),
                Separator.COMMA,
                new Column(ctx.toRealTable(exportedBookTable), "NAME"),
                Separator.COMMA,
                new Column(ctx.toRealTable(exportedAuthorTable), "ID"),
                Separator.COMMA,
                new Column(ctx.toRealTable(exportedAuthorTable), "NAME")
            )
        );
        expectCode(sql(q, true), `
            select 
                tb_1_.c1,
                tb_1_.c2,
                tb_1_.c3,
                tb_1_.c4
            from (
                select 
                    tb_2_.ID c1,
                    tb_2_.NAME c2,
                    tb_3_.ID c3,
                    tb_3_.NAME c4,
                    row_number() over(partition by tb_2_.STORE_ID order by tb_2_.PRICE desc)
                from  tb_2_
                inner join  tb_3_
                where
                    tb_2_.EDITION = @p1
                select 
                    tb_5_.ID c1,
                    tb_5_.NAME c2,
                    tb_4_.ID c3,
                    tb_4_.NAME c4,
                    row_number() over(partition by tb_5_.STORE_ID order by tb_5_.PRICE desc)
                from  tb_4_
                inner join  tb_5_
                where
                    tb_4_.NAME ilike @p2
            ) tb_1_
        `);
    });
});