import { View } from "@/schema/dto/global_api";
import { AbstractEntityTable } from "../entity_table";

export interface FetchedViewContract {

    readonly table: AbstractEntityTable;

    readonly view: View<any, any>;
}