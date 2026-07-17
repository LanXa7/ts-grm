import { View } from "@/schema/dto/api";
import { AbstractEntityTable } from "../entity_table";

export interface FetchedViewContract {

    readonly table: AbstractEntityTable;

    readonly view: View<any, any>;
}