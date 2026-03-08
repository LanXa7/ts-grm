import { ast, err, metadata, SqlClient } from "@ts-grm/core";
import { RealTable } from "./real_table";
import { SqlBuilder } from "./sql_builder";
import { FragmentGenGenVisitor } from "./fragment_gen_visitor";
import { SqlClientImplementor } from "@/sql_client";
import { BaseQueryMetadata } from "./base_query_metadata";
import { PreVisitor } from "./pre_visitor";

export abstract class Fragment {

    abstract into(builder: SqlBuilder): void;
}

export class Composite extends Fragment {

    protected _fragments: Array<Fragment | string> | undefined = undefined;

    private _texts: Array<string> | undefined = undefined;

    get fragments(): ReadonlyArray<Fragment | string> | undefined {
        return this._fragments;
    }

    add(fragment: Fragment) {
        this.flush();
        let fragments = this._fragments;
        if (fragments == null) {
            this._fragments = fragments = [];
        }
        fragments.push(fragment);
    }

    text(value: string): this {
        if (value === "") {
            return this;
        }
        let texts = this._texts;
        if (texts == null) {
            this._texts = texts = [];
        }
        texts.push(value);
        return this;
    }

    protected flush() {
        let texts = this._texts;
        if (texts == null) {
            return;
        }
        let fragments = this._fragments;
        if (fragments == null) {
            this._fragments = fragments = [];
        }
        fragments.push(texts.join(""));
        this._texts = undefined;
    }

    protected get isDirty(): boolean {
        return this._fragments != null || this._texts != null;
    }

    separator() {
        throw new err.StateError(`Cannot invoke "separator", it is not supported by current composite`);
    }

    into(builder: SqlBuilder): void {
        this.flush();
        const fragments = this._fragments;
        if (fragments != null) {
            for (const fragment of fragments) {
                if (typeof fragment === "string") {
                    builder.sql(fragment);
                } else {
                    fragment.into(builder);
                }
            }
        }
    }

    static of(o: any, sqlClient: SqlClient, metadata: BaseQueryMetadata | undefined): Composite {
        const preVisitor = new PreVisitor(sqlClient as SqlClientImplementor);
        (o as ast.Node).accept(preVisitor);
        const visitor = new FragmentGenGenVisitor(
            sqlClient as SqlClientImplementor, 
            metadata, 
            preVisitor.tableMap
        );
        (o as ast.Node).accept(visitor);
        return visitor.toResult();
    }
}

export class Scope extends Composite {

    constructor(
        readonly kind: ScopeKind
    ) {
        super();
    }

    separator() {
        if (this.isDirty) {
            switch (this.kind) {
                case "AND":
                    this.add(Separator.AND);
                    break;
                case "OR":
                    this.add(Separator.OR);
                    break;
                case "UNION":
                    this.add(Separator.UNION);
                    break;
                case "UNION_ALL":
                    this.add(Separator.UNION_ALL);
                    break;
                case "MINUS":
                    this.add(Separator.MINUS);
                    break;
                case "INTERSECT":
                    this.add(Separator.INTERSECT);
                    break;
                case "COMMA":
                case "VALUES":
                    this.add(Separator.COMMA);
                    break;
            }
        }
    }

    into(builder: SqlBuilder): void {
        this.flush();
        if (builder.pretty) {
            if (this.kind === "VALUES") {
                builder.sql("(\n");
                this._renderChildren(builder);
                builder.sql("\n)");
            } else {
                builder.sql("\n");
                this._renderChildren(builder);
                builder.sql("\n");
            }
        } else {
            if (this.kind === "VALUES") {
                builder.sql("(");
                this._renderChildren(builder);
                builder.sql(")");
            } else {
                this._renderChildren(builder);
            }
        }
    }

    private _renderChildren(builder: SqlBuilder) {
        const fragments = this._fragments;
        if (fragments == null) {
            return;
        }
        if (builder.pretty) {
            let indent = true;
            switch (this.kind) {
                case "UNION":
                case "UNION_ALL":
                case "MINUS":
                case "INTERSECT":
                    indent = false;
                    break;
            }    
            for (const fragment of fragments) {
                if (fragment instanceof Separator) {
                    fragment.into(builder);
                } else {
                    if (indent) {
                        builder.indent();
                    }
                    if (typeof fragment === "string") {
                        builder.sql(fragment);
                    } else {
                        fragment.into(builder);
                    }
                    if (indent) {
                        builder.unindent();
                    }
                }
            }
        } else {
            for (const fragment of fragments) {
                if (typeof fragment === "string") {
                    builder.sql(fragment);
                } else {
                    fragment.into(builder);
                }
            }
        }
    }
}

export type ScopeKind = "INDENT" | "COMMA" | "VALUES" | "AND" | "OR" | "UNION" | "UNION_ALL" | "MINUS" | "INTERSECT";

export class Separator extends Fragment {

    static COMMA = new Separator(",\n");

    static AND = new Separator("\nand\n");

    static OR = new Separator("\nor\n");

    static UNION = new Separator("\nunion\n");

    static UNION_ALL = new Separator("\nunion all\n");

    static MINUS = new Separator("\nminus\n");

    static INTERSECT = new Separator("\nintersect\n");

    private constructor(
        readonly text: string
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        builder.sql(this.text);
    }
}

export class Column extends Fragment {
    
    constructor(
        readonly table: RealTable, 
        readonly name: string
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        // if (this.table.isShadow) {
        //     const baseTable = this.table._baseTable!;
        //     builder
        //         .sql(baseTable.alias)
        //         .sql(".")
        //         .sql(this.table.shadowAlias(this.name));
        //     return;
        // }
        builder.sql(this.table.alias).sql(".").sql(this.name);
    }
}

export class ShadowColumn extends Fragment {
    
    constructor(
        readonly table: RealTable, 
        readonly exportedName: string,
        readonly name: string
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        const alias = this.table.baseQueryMetadata.alias(this.exportedName, this.name);
        builder.sql(this.table.alias).sql(".").sql(alias);
    }
}

export class ShadowExpr extends Fragment {

    constructor(
        readonly table: RealTable, 
        readonly exportedName: string
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        const alias = this.table.baseQueryMetadata.alias(this.exportedName, undefined);
        builder.sql(this.table.alias).sql(".").sql(alias);
    }
}

export class ExportedTable extends Fragment {
    
    constructor(
        readonly table: RealTable
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        builder.sql("@@@");
        // const shadowAliasMap = this.table._shadow?.shadowAliasMap;
        // if (shadowAliasMap === undefined) {
        //     builder.sql("1");
        // } else {
        //     let addComma = false;
        //     for (const [columnName, alias] of shadowAliasMap.entries()) {
        //         if (addComma) {
        //             builder.sql(",\n");
        //         } else {
        //             addComma = true;
        //         }
        //         builder
        //             .sql(this.table.alias)
        //             .sql(".")
        //             .sql(columnName)
        //             .sql(" ")
        //             .sql(alias);
        //     }
        // }
    }
}

export class Value extends Fragment {

    constructor(readonly value: any) {
        super();
    }

    into(builder: SqlBuilder): void {
        builder.value(this);
    }
}

export class Query extends Composite {

    private _source: Source | undefined = undefined;

    add(fragment: Fragment): void {
        if (fragment instanceof Source) {
            this._source = fragment;
        }
        super.add(fragment);
    }

    into(builder: SqlBuilder): void {
        const source = this._source!;
        const tables = new Set<RealTable>();
        for (const rootTable of source.rootTables) {
            rootTable.collectTables(builder, tables);
        }
        super.into(builder);
    }
}

export class Source extends Composite {

    constructor(
        readonly rootTables: ReadonlyArray<RealTable>
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        for (const rootTable of this.rootTables) {
            if (rootTable.symbol.baseModel == null) {
                const entityTable = rootTable.symbol as metadata.AbstractEntityTable;
                builder
                    .sql(entityTable.entity.toTableName(builder.strategy))
                    .sql(" ")
                    .sql(rootTable.alias);
            } else {
                const baseTable = rootTable.symbol as metadata.TypedBaseTable;
                if (!baseTable.baseModel!.__isCte) {
                    const composite = Composite.of(
                        baseTable.baseModel!.__toQuery(), 
                        builder.sqlClient,
                        rootTable.baseQueryMetadata
                    );
                    const wrapper = new Scope("VALUES");
                    wrapper.add(composite);
                    wrapper.into(builder);
                }
                builder.sql(" ").sql(rootTable.alias);
            }
        }
    }
}
