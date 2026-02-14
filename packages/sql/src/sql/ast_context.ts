import { metadata } from "@ts-grm/core";
import { JoinMergeScope } from "./join_merge_scope";
import { RealTable } from "./real_table";

export class AstContext {
    
    private _joinMergeScope: JoinMergeScope | undefined;

    private _tableMap = new Map<metadata.AbstractEntityTable | metadata.BaseTableTarget, RealTable>();

    toRealTable(table: metadata.AbstractEntityTable | metadata.BaseTableTarget): RealTable {
        let realTable = this._tableMap.get(table);
        if (realTable == null) {
            const joinOperation = table instanceof metadata.AbstractEntityTable 
                ? table.joinOperation
                : undefined;
            if (joinOperation == null) {
                realTable = new RealTable(table);
            } else {
                const parentRealTable = this.toRealTable(joinOperation.parent);
                realTable = parentRealTable.child(table as metadata.AbstractEntityTable, this._joinMergeScope);
            }
            this._tableMap.set(table, realTable);
        }
        return realTable;
    }

    underMergeScope(fn: () => void) {
        this._joinMergeScope = new JoinMergeScope(this._joinMergeScope);
        try {
            fn();
        } finally {
            this._joinMergeScope = this._joinMergeScope.parent;
        }
    }
}
