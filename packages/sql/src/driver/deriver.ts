import { ColumnDef } from "@/impl/schema_def";
import { NodeRender } from "./node_render";

export interface Driver {

    readonly name: string;

    readonly nodeRender: NodeRender;

    readonly nameParameterPrefix: string | undefined;

    readonly isRecursiveKeywordRequired: boolean;

    typeName(columnDef: ColumnDef): string;
}
