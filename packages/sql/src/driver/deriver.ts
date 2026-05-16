import { ColumnDef } from "@/impl/schema_def";
import { NodeRender } from "./node_render";
import { TransactionManager } from "@/transaction/transaction_manger";
import { metadata } from "@ts-grm/core";

export interface Driver extends metadata.DatabaseKeywordStrategy {

    readonly name: string;

    readonly nodeRender: NodeRender;

    readonly nameParameterPrefix: string | undefined;

    readonly isRecursiveKeywordRequired: boolean;

    typeName(columnDef: ColumnDef): string;

    requiresInlineConstraints: boolean;

    readonly transactionManager: TransactionManager;
}
