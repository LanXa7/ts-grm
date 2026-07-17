import { FetchedView } from "@/dsl/root_query";
import { AnyModel } from "@/schema/model";
import { AbstractEntityTable } from "./entity_table";
import { AbstractSelection, FetchedViewContract, Node, Visitor } from "./ast";
import { View } from "@/schema/dto/api";

export class FetchedViewImpl<TModel extends AnyModel, X> extends AbstractSelection implements FetchedView<TModel, X>, FetchedViewContract, Node {

    __type(): {
        readonly selectionLike: true;
        readonly selectedView: true;
        readonly model?: TModel;
        readonly x?: X;
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