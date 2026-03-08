import { Entity } from "./entity";
import { BaseModelImplementor } from "./base_query_implementor";
import { TypedBaseTable } from "./base_table";

export interface AbstractTable {

    readonly entity: Entity | undefined;

    readonly baseModel: BaseModelImplementor<any> | undefined;

    readonly shadow: TypedBaseTable | undefined;
}