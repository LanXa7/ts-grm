import { ColumnDef } from "@/impl/schema_def";
import { NodeRender } from "./node_render";
import { TransactionManager } from "@/transaction/transaction_manger";

export interface Driver {

    readonly name: string;

    readonly nodeRender: NodeRender;

    readonly nameParameterPrefix: string | undefined;

    readonly isRecursiveKeywordRequired: boolean;

    typeName(columnDef: ColumnDef): string;

    readonly transactionManager: TransactionManager;
}
