import { AbstractTable } from "./abstract_table";
import { Entity } from "./entity";
import { BaseModelImplementor } from "./base_query_implementor";
import { JoinFilter, JoinOperation } from "./entity_table";
import { ShadowAnchor } from "./shadow_anchor";
import { TypedBaseTable } from "./base_table";
import { AnyAssociationModel, BaseQuerySelectMapArgs, JoinType, ModelLike } from "@/dsl";
import { suppressUnused } from "@/utils";

export class AbstractAssociationTable implements AbstractTable {

    constructor(
        readonly __associationModel: AnyAssociationModel
    ) {
    }

    __type(): {
        readonly tableLike: true;
        readonly associationTableLike: true
    } {
        return {
            tableLike: true,
            associationTableLike: true
        }
    }

    get __entity(): Entity | undefined {
        return undefined;
    }
    
    get __baseModel(): BaseModelImplementor<any> | undefined {
        return undefined;
    }

    get __joinOperation(): JoinOperation | undefined {
        return undefined;
    }

    get __anchor(): ShadowAnchor | undefined {
        return undefined;
    }

    get __shadow(): TypedBaseTable | undefined {
        return undefined;
    }

    get __args(): BaseQuerySelectMapArgs | undefined {
        return undefined;
    }

    get __isCte(): boolean {
        return false;
    }

    get __isPrev(): boolean {
        return false;
    }

    get __isNullable(): boolean {
        return false;
    }

    get __prototype(): AbstractTable {
        return this;
    }

    join(
        model: ModelLike,
        options: JoinFilter | {
            readonly joinType?: JoinType,
            readonly filter: JoinFilter
        }
    ): AbstractTable {
        suppressUnused(model);
        suppressUnused(options);
        throw new Error();
    }
}