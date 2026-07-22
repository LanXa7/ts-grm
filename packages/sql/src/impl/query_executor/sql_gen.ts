import { SqlClientImplementor } from "@/sql_client";
import { RootQuery } from "@ts-grm/core";
import { SqlBuilder } from "@/sql/sql_builder";
import { Composite, Scope, Value } from "@/sql/fragment";
import { AtomRootQueryImpl } from "../atom_root_query_impl";
import { ExecuteQueryOptions } from "./execute_query";

export function buildStatement(
    sqlClient: SqlClientImplementor,
    query: RootQuery<any>,
    options: ExecuteQueryOptions | undefined
): [string, ReadonlyArray<any>] {
    const composite = buildAst(sqlClient, query, options);
    const builder = SqlBuilder.of(sqlClient);
    composite.into(builder);
    const [sql, argumentMap] = builder.build();
    const args = Array.from(argumentMap.values());
    return [sql, args];
}

function buildAst(
    sqlClient: SqlClientImplementor,
    query: RootQuery<any>,
    options: ExecuteQueryOptions | undefined
): Composite {
    if (options === "COUNT") {
        if (query instanceof AtomRootQueryImpl) {
            const countQuery = query.toCount();
            if (countQuery != null) {
                return Composite.of(countQuery, sqlClient, undefined);
            }
        }
        const composite = new Composite();
        composite.add("select ");
        composite.add(new Scope("COMMA").add("count(1)"));
        composite.add("from ");
        composite.add(
            new Scope("SUB_QUERY").add(
                Composite.of(query, sqlClient, undefined)
            )
        );
        return composite;
    }
    if (options != null) {
        if (query instanceof AtomRootQueryImpl) {
            const composite = new Composite();
            composite.add(Composite.of(query, sqlClient, undefined));
            composite.add("\nlimit ").add(new Value(options.limit));
            if (options.offset != null) {
                composite.add("\noffset ").add(new Value(options.offset));
            }
            return composite;
        }
        const composite = new Composite();
        composite.add("select ");
        composite.add(new Scope("INDENT").add("*"));
        composite.add("from ");
        composite.add(
            new Scope("SUB_QUERY").add(
                Composite.of(query, sqlClient, undefined)
            )
        );
        composite.add("\nlimit ").add(new Value(options.limit));
        if (options.offset != null) {
            composite.add("\noffset ").add(new Value(options.offset));
        }
        return composite;
    }
    return Composite.of(query, sqlClient, undefined);
}