import { FetchedView } from "@/dsl/root_query";
import { View } from "@/schema/dto";
import { AnyModel } from "@/schema/model";
import { AbstractEntityTable } from "./entity_table";

export class FetchedViewImpl<TModel extends AnyModel, X> implements FetchedView<TModel, X> {

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
    ) {}
}