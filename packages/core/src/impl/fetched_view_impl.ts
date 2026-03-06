import { FetchedView } from "@/dsl/root_query";
import { View } from "@/schema/dto";
import { AnyModel } from "@/schema/model";
import { AbstractEntityTable } from "./entity_table";
import { AbstractSelection, FetchedViewContract, Node, Visitor } from "./ast";

export class FetchedViewImpl<TModel extends AnyModel, X> extends AbstractSelection implements FetchedView<TModel, X>, FetchedViewContract, Node {

    __type(): {
        selectionLike: true;
        selectedView: [TModel, X] | true;
    } {
        return {
            selectionLike: true,
            selectedView: true
        };
    }

    constructor(
        readonly table: AbstractEntityTable,
        readonly view: View<TModel, X>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitFetchedView(this);
    }
}