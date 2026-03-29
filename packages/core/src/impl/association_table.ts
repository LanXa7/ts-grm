import { AbstractTable } from "./abstract_table";
import { Entity } from "./entity";
import { BaseModelImplementor } from "./base_query_implementor";
import { AbstractEntityTable, JoinFilter, JoinOperation } from "./entity_table";
import { ShadowAnchor } from "./shadow_anchor";
import { TypedBaseTable } from "./base_table";
import { AnyAssociationModel, BaseQuerySelectMapArgs, JoinType, ModelLike } from "@/dsl";
import { suppressUnused } from "@/utils";

export class AbstractAssociationTable implements AbstractTable {

    private _source: AbstractEntityTable | undefined = undefined;

    private _target: AbstractEntityTable | undefined = undefined;

    constructor(
        readonly __associationModel: AnyAssociationModel,
        private readonly joinOperation: JoinOperation | undefined
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

    // get source(): AbstractEntityTable {
    //     let source = this._source;
    //     if (source == null) {
    //         const joinOperation = this.__joinOperation;
    //         if (joinOperation?.joinProp === "source") {
    //             source = this.joinOperation?.parent as AbstractEntityTable;
    //         } else {
    //             const newJoinOperation: JoinOperation = {
    //                 parent: this,
    //                 joinType: joinOperation?.joinType ?? "INNER",
    //                 joinProp: "source",
    //                 weakJoinModel: undefined,
    //                 castToEntity: undefined,
    //                 filter: undefined
    //             };
    //             source = this.__associationModel.sourceEntity.table(newJoinOperation);
    //         }
    //         this._source = source;
    //     }
    //     return source;
    // }

    // get target(): AbstractEntityTable {
    //     let target = this._target;
    //     if (target == null) {
    //         const newJoinOperation: JoinOperation = {
    //             parent: this,
    //             joinType: this.joinOperation?.joinType ?? "INNER",
    //             joinProp: "target",
    //             weakJoinModel: undefined,
    //             castToEntity: undefined,
    //             filter: undefined
    //         };
    //         this._target = target = this.__associationModel.targetEntity.table(newJoinOperation);
    //     }
    //     return target;
    // }

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
