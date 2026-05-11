import { ColumnDef } from "@/impl/schema_def";
import { NodeRender } from "./node_render";
import { TransactionOptions } from "@ts-grm/core";

export interface Driver {

    readonly name: string;

    readonly nodeRender: NodeRender;

    readonly nameParameterPrefix: string | undefined;

    readonly isRecursiveKeywordRequired: boolean;

    typeName(columnDef: ColumnDef): string;

    execute<R>(
        options: TransactionOptions,
        fn: () => Promise<R>
    ): Promise<R>;
}
