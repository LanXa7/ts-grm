import { metadata, SqlClient } from "@ts-grm/core";
import { Value } from "./fragment";
import { SqlClientImplementor } from "@/sql_client";
import { SqlLoggerParameterType } from "@/cfg/sql_client_options";

export class SqlBuilder {

    readonly strategy: metadata.DatabaseNamingStrategy;

    private readonly _parts: Array<string> = [];

    private _length: number = 0;

    private readonly _values = new Map<number, Value>();

    private _indent = 0;

    private _indentAdded = false;

    private _nextTableAlias = 0;

    constructor(
        readonly sqlClient: SqlClientImplementor,
        readonly pretty: boolean,
        readonly parameter: SqlLoggerParameterType,
        readonly nameParameterPrefix: string | undefined
    ) {
        this.strategy = sqlClient.options.strategy;
    }

    static of(sqlClient: SqlClient): SqlBuilder {
        const implementor = sqlClient as SqlClientImplementor;
        return new SqlBuilder(
            implementor,
            implementor.options.sqlLogger.pretty,
            implementor.options.sqlLogger.parameter,
            implementor.driver.nameParameterPrefix
        )
    }

    indent() {
        ++this._indent;
    }

    unindent() {
        --this._indent;
    }

    newLine(): this {
        if (this.pretty) {
            this._parts.push("\n");
            this._length++;
            this._indentAdded = false;
        }
        return this;
    }

    sql(text: string): this {
        if (!text.includes("\n")) {
            this._sql(text);
        } else {
            const parts = text.split("\n");
            for (let i = 0; i < parts.length; i++) {
                if (i !== 0 && this._parts[this._parts.length - 1] !== "\n") {
                    if (this.pretty) {
                        this._parts.push("\n");
                        this._indentAdded = false;
                    } else {
                        this._parts.push(" ");
                    }
                    this._length++;
                }
                this._sql(parts[i]!);
            }
        }
        return this;
    }

    value(value: Value): this {
        this._values.set(this._length, value);
        let str: string;
        if (this.nameParameterPrefix != null) {
            str = `${this.nameParameterPrefix}${this._values.size}`;
        } else {
            str = "?";
        }
        this._sql(str);
        return this;
    }

    private _sql(str: string) {
        if (str.length === 0) {
            return;
        }
        if (this._indent && !this._indentAdded) {
            for (let i = this._indent; i > 0; --i) {
                this._parts.push(INDENT);
            }
            this._length += INDENT.length * this._indent;
            this._indentAdded = true;
        }
        this._parts.push(str);
        this._length += str.length;
    }

    build(): [string, ReadonlyMap<number, Value>] {
        if (this._parts[this._parts.length - 1] === '\n') {
            this._parts.splice(this._parts.length - 1, 1);
        }
         return [this._parts.join(""), this._values];
    }

    allocateTableAlias(): string {
        return `tb_${++this._nextTableAlias}_`;
    }
}

const INDENT = "    ";