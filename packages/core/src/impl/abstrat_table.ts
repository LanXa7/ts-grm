import { Entity } from "./entity";
import { BaseModelImplementor } from "./base_query_implementor";

export interface AbstractTable {

    get entity(): Entity | undefined;

    get baseModel(): BaseModelImplementor<any> | undefined;
}