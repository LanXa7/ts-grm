import { BaseModel, BaseQuery } from "@/dsl";
import { BaseQueryMapOf } from "@/dsl/base-query";

export interface BaseQueryImplementor<TProjction> extends BaseQuery<TProjction> {

    toModel(isCte: boolean): BaseModel<BaseQueryMapOf<TProjction>>;
}