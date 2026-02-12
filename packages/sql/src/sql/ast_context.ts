import { AbstractEntityTable } from "@ts-grm/core";
import { JoinMergeScope } from "./join_merge_scope";
import { RealTable } from "./real_table";

export class AstContext {
    
    private _joinMergeScope: JoinMergeScope | undefined;

    private _tableMap = new Map<AbstractEntityTable, RealTable>();

    toRealTable(table: AbstractEntityTable): RealTable {
        let realTable = this._tableMap.get(table);
        if (realTable == null) {
            const joinOperation = table.joinOperation;
            if (joinOperation == null) {
                realTable = new RealTable(table);
            } else {
                const parentRealTable = this.toRealTable(joinOperation.parent);
                realTable = parentRealTable.child(table, this._joinMergeScope);
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
