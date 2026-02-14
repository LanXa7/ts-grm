import { RealTable } from "./real_table";
import { SqlBuilder } from "./sql_builder";

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

    text(value: string) {
        if (value === "") {
            return;
        }
        let texts = this._texts;
        if (texts == null) {
            this._texts = texts = [];
        }
        texts.push(value);
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
            for (const fragment of fragments) {
                if (fragment instanceof Separator) {
                    fragment.into(builder);
                } else {
                    builder.indent();
                    if (typeof fragment === "string") {
                        builder.sql(fragment);
                    } else {
                        fragment.into(builder);
                    }
                    builder.unindent();
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

export type ScopeKind = "INDENT" | "COMMA" | "VALUES" | "AND" | "OR";

export class Separator extends Fragment {

    static COMMA = new Separator(", ", ",\n");

    static AND = new Separator(" and ", "\nand\n");

    static OR = new Separator(" or ", "\nor\n");

    private constructor(
        readonly text: string,
        readonly prettyText: string
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        if (builder.pretty) {
            builder.sql(this.prettyText);
        } else {
            builder.sql(this.text);
        }
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
        builder.sql(this.table.alias).sql(".").sql(this.name);
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

export class Query extends Fragment {

    constructor(
        readonly rootTables: ReadonlyArray<RealTable>,
        readonly where: Scope | undefined,
        readonly orderBy: Scope | undefined,
        readonly groupBy: Scope | undefined,
        readonly having: Scope | undefined,
        readonly select: Scope
    ) {
        super();
    }

    into(builder: SqlBuilder): void {
        const tables = new Set<RealTable>();
        for (const rootTable of this.rootTables) {
            rootTable.collectTables(builder, tables);
        }
        builder.sql("select ");
        this.select.into(builder);
        for (const table of tables) {
            if (table.joinType == null) {
                table.render(builder);
            }
        }
        for (const table of tables) {
            if (table.joinType != null) {
                table.render(builder);
            }
        }
        if (this.where != null) {
            builder.sql("\nwhere\n");
            this.where.into(builder);
        }
        if (this.orderBy != null) {
            builder.sql("\norder by\n");
            this.orderBy.into(builder);
        }
        if (this.groupBy != null) {
            builder.sql("\ngroup by\n");
            this.groupBy.into(builder);
        }
        if (this.having != null) {
            builder.sql("\ngroup by\n");
            this.having.into(builder);
        }
    }
}