import { SqliteDriver } from "@/driver/sqlite_driver";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { newSqlClient } from "@/sql_client";
import { dto, RootQuery } from "@ts-grm/core";
import { BOOK, BOOK_STORE, PAPER_BOOK } from "../model/model";

export const sqlClient = newSqlClient(new SqliteDriver(), {
    sqlLogger: {
        pretty: true
    }
});

export function sql(q: RootQuery<any>): string {
    const composite = Composite.of(q, sqlClient, undefined);
    const builder = SqlBuilder.of(sqlClient);
    composite.into(builder);
    const [sql] = builder.build();
    return sql;
}

export const SIMPLE_BOOK_VIEW = dto.view(BOOK, $ => $.id.name.edition);

export const SIMPLE_STORE_VIEW = dto.view(BOOK_STORE, $ => $.id.name.version);

export const SIMPLE_PAPER_BOOK_VIEW = dto.view(
    PAPER_BOOK, $ => $.allScalars()
);