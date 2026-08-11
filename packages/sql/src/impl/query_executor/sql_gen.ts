import { SqlClientImplementor } from "@/sql_client";
import { RootQuery, spi } from "@ts-grm/core";
import { SqlBuilder } from "@/sql/sql_builder";
import { Composite, Scope } from "@/sql/fragment";
import { AtomRootQueryImpl } from "../atom_root_query_impl";
import { ExecuteQueryOptions } from "./execute_query";
import { ApplyPaginationOptions } from "@/driver/deriver";
import { NumericTypeArrayProvider } from "../numeric_type_array_provider";

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
        const applyPaginationOptions: ApplyPaginationOptions = {
            ...options,
            wrapper: !(query instanceof AtomRootQueryImpl)
        };
        return sqlClient.driver.applyPagination(
            Composite.of(query, sqlClient, undefined), 
            applyPaginationOptions
        );
    }
    return Composite.of(query, sqlClient, undefined);
}

export function numericTypesOf(
    query: RootQuery<any>, 
    countMode: boolean
) : ReadonlyArray<spi.NumericType> | undefined {
    if (countMode) {
        return [spi.NumericType.INTEGER];
    }
    return (query as any as NumericTypeArrayProvider).numericTypes;
}