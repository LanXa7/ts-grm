import { Entity } from "../entity";
import { AbstractEntityTable } from "../entity_table";
import { AbstractPred } from "./pred";
import { Visitor } from "./visitor";

export class IsPred extends AbstractPred {

    constructor(
        readonly table: AbstractEntityTable,
        readonly derivedEntity: Entity,
        readonly neg: boolean
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitIsPred(this);
    }

    negative(): IsPred {
        return new IsPred(
            this.table,
            this.derivedEntity,
            !this.neg
        );
    }
}