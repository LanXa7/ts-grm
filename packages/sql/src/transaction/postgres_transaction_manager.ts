import { Pool, PoolClient } from "pg";
import { AbstractTransactionManager, TransactionContext } from "./abstract_transaction_manager";
import { Isolation } from "@ts-grm/core";
import { Executor } from "./executor";
import { DataRows } from "@/impl/data_row_reader";
import { Value } from "@/sql/fragment";

export class PostgresTransactionManager extends AbstractTransactionManager<PostgresTransactionContext> {

    constructor(
        protected readonly pool: Pool
    ) {
        super();
    }

    protected override create(
        isolation: Isolation | undefined, 
        timeout: number, 
        prevForSavepoint: PostgresTransactionContext | undefined
    ): PostgresTransactionContext {
        return new PostgresTransactionContext(isolation, timeout, prevForSavepoint);
    }

    protected override async open(ctx: PostgresTransactionContext): Promise<void> {
        ctx.con = await this.pool.connect();
    }

    protected override async close(ctx: PostgresTransactionContext): Promise<void> {
        ctx.con!.release();
    }

    protected override async begin(ctx: PostgresTransactionContext): Promise<void> {
        await ctx.con!.query("begin");
    }

    protected override async commit(ctx: PostgresTransactionContext): Promise<void> {
        await ctx.con!.query("commit");
    }

    protected override async rollback(ctx: PostgresTransactionContext): Promise<void> {
        await ctx.con!.query("rollback");
    }
}

class PostgresTransactionContext extends TransactionContext<PostgresTransactionContext> {

    private static _savepointIdSequence = 0;

    readonly savepointName: string | undefined;

    con: PoolClient | undefined = undefined;

    constructor(
        isolation: Isolation | undefined,
        timeout: number,
        prevForSavepoint: PostgresTransactionContext | undefined
    ) {
        super(isolation, timeout, prevForSavepoint);
        this.savepointName = prevForSavepoint != null
            ? `savepoint_${++PostgresTransactionContext._savepointIdSequence}`
            : undefined
    }

    protected createExecutor(): Executor {
        return new PostgresExecutor(this.con!);
    }
}

class PostgresExecutor implements Executor {

    constructor(
        private readonly _con: PoolClient
    ) {}

    async execute(sql: string): Promise<void> {
        await this._con.query(sql);
    }

    async executeStatement(
        sql: string, 
        args: ReadonlyArray<Value>
    ): Promise<DataRows> {
        const values = args.map(v => v.value);
        const result = await this._con.query({
            text: sql, 
            values: values,
            rowMode: 'array'
        });
        return result.rows;
    }

    executeStatements(
        _sql: string, 
        _binds: ReadonlyArray<ReadonlyArray<Value>>
    ): Promise<ReadonlyArray<DataRows>> {
        throw new Error();
    }
}