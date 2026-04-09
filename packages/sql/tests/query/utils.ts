import { SqliteDriver } from "@/driver/sqlite_driver";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { newSqlClient } from "@/sql_client";
import { ast, dto, RootQuery } from "@ts-grm/core";
import { AUTHOR, BOOK, BOOK_STORE, COMMENT, ORDER, ORDER_ITEM, PAPER_BOOK, PHYSICAL_BOOK_STORE, TREE_NODE } from "../model/model";
import { AtomRootQueryImpl } from "@/impl/atom_root_query_impl";
import { MergedRootQueryImpl } from "@/impl/merged_query";

export const sqlClient = newSqlClient(new SqliteDriver(), {
    sqlLogger: {
        pretty: true
    }
});

export function sql(q: RootQuery<any>): string {
    const contract = q as any as ast.QueryContract;
    const sqlClient = contract.kind === "ATOM"
        ? (q as AtomRootQueryImpl<any>).mutableQuery.sqlClient
        : (q as MergedRootQueryImpl<any>).sqlClient;
    const composite = Composite.of(q, sqlClient, undefined);
    const builder = SqlBuilder.of(sqlClient);
    composite.into(builder);
    const [sql] = builder.build();
    return sql;
}

export const SIMPLE_BOOK_VIEW = dto.view(
    BOOK, 
    $ => $.id.name.edition
);

export const SIMPLE_STORE_VIEW = dto.view(
    BOOK_STORE, 
    $ => $.id.name.version
);

export const SIMPLE_PAPER_BOOK_VIEW = dto.view(
    PAPER_BOOK, 
    $ => $.allScalars()
);

export const SIMPLE_PHYSICAL_BOOK_STORE_VIEW = dto.view(
    PHYSICAL_BOOK_STORE, 
    $ => $.allScalars()
);

export const SIMPLE_TREE_NODE_VIEW = dto.view(
    TREE_NODE,
    $ => $.allScalars()
);

export const SIMPLE_AUTHOR_VIEW = dto.view(
    AUTHOR,
    $ => $.id.name($ => $.allScalars())
);

export const SIMPLE_ORDER_VIEW = dto.view(
    ORDER,
    $ => $.allScalars()
);

export const SIMPLE_ITEM_VIEW = dto.view(
    ORDER_ITEM,
    $ => $.id.productName
);

export const SIMPLE_COMMENT_VIEW = dto.view(
    COMMENT,
    $ => $.id.name
);