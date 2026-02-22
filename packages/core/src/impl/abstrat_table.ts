import { BaseModel } from "@/dsl";
import { Entity } from "./entity";

export interface AbstractTable {

    get entity(): Entity | undefined;

    get baseModel(): BaseModel<any> | undefined;
}