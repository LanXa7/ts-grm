import { EntityProp } from "../entity_prop";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./str_expr";
import { AbstractEsExpr } from "./es_expr";
import { AbstractDtExpr } from "./dt_expr";
import { ArgumentError } from "@/error/common";
import { AbstractEntityTable } from "../entity_table";
import { Visitor } from "./visitor";
import { AssociationProp } from "../association_entity";
import { AbstractAssociationTable } from "../association_table";
import { EnumSetProvider, ScalarProvider } from "@/schema/scalar";

export interface PropExprContract {
    readonly table: AbstractEntityTable | AbstractAssociationTable;
    readonly prop: EntityProp | AssociationProp;
}

export function createTableProp(
    table: AbstractEntityTable | AbstractAssociationTable, 
    prop: EntityProp | AssociationProp
) {
    if (prop.scalarType == null) {
        throw new ArgumentError(
            `Cannot create table prop for "${
                prop.toString()
            }" which is not scalar property`
        );
    }
    const isAssociation = table instanceof AbstractAssociationTable;
    if (isAssociation !== prop.isMiddleTableProp) {
        throw new ArgumentError(
            `The property "${prop.toString()}" is not ${
                isAssociation ? "association" : "entity"
            } property`
        );
    }
    const directTable = prop instanceof EntityProp
        ? (table as AbstractEntityTable).__to(prop.declaringEntity)
        : table;
    switch (prop.scalarType.kind) {
        case "I32":
            if (prop instanceof EntityProp && prop.scalarProvider instanceof EnumSetProvider) {
                return new PropEsExpr(directTable, prop, isAssociation);
            }
            return new PropNumExpr(directTable, prop, isAssociation);
        case "I8":
        case "I16":
        case "I64":
        case "NUM":
        case "F32":
        case "F64":
            return new PropNumExpr(directTable, prop, isAssociation);
        case "STR":
            return new PropStrExpr(directTable, prop, isAssociation);
        case "DATE":
            return new PropDtExpr(directTable, prop, isAssociation);
        default:
            throw new ArgumentError(
            `Cannot create table prop for "${
                prop.toString()
            }" whose scalar type is ${prop.scalarType}`
        );
    }
}

class PropNumExpr<T extends string | number> extends AbstractNumExpr<T> implements PropExprContract {

    private readonly _provider: ScalarProvider<any, any> | undefined;

    constructor(
        readonly table: AbstractEntityTable | AbstractAssociationTable,
        readonly prop: EntityProp | AssociationProp,
        readonly isAssociation: boolean
    ) {
        super(
            prop instanceof EntityProp
                ? prop.numericType === "string"
                : false
        );
        if (prop instanceof EntityProp) {
            this._provider = prop.scalarProvider;
        } else {
            this._provider = undefined;
        }
    }

    override get scalarProvider(): ScalarProvider<any, any> | undefined {
        return this._provider;
    }

    accept(visitor: Visitor): void {
        visitor.visitPropExpr(this);
    }
}

class PropStrExpr extends AbstractStrExpr implements PropExprContract {

    private readonly _provider: ScalarProvider<any, any> | undefined;

    constructor(
        readonly table: AbstractEntityTable | AbstractAssociationTable,
        readonly prop: EntityProp | AssociationProp,
        readonly isAssociation: boolean
    ) {
        super();
        if (prop instanceof EntityProp) {
            this._provider = prop.scalarProvider;
        } else {
            this._provider = undefined;
        }
    }

    override get scalarProvider(): ScalarProvider<any, any> | undefined {
        return this._provider;
    }

    accept(visitor: Visitor): void {
        visitor.visitPropExpr(this);
    }
}

class PropEsExpr<T extends string> extends AbstractEsExpr<T> implements PropExprContract {

    private readonly _provider: ScalarProvider<any, any> | undefined;

    constructor(
        readonly table: AbstractEntityTable | AbstractAssociationTable,
        readonly prop: EntityProp | AssociationProp,
        readonly isAssociation: boolean
    ) {
        super();
        if (prop instanceof EntityProp) {
            this._provider = prop.scalarProvider;
        } else {
            this._provider = undefined;
        }
    }

    override get scalarProvider(): ScalarProvider<any, any> | undefined {
        return this._provider;
    }

    accept(visitor: Visitor): void {
        visitor.visitPropExpr(this);
    }
}

class PropDtExpr extends AbstractDtExpr implements PropExprContract {
    
    private readonly _provider: ScalarProvider<any, any> | undefined;

    constructor(
        readonly table: AbstractEntityTable | AbstractAssociationTable,
        readonly prop: EntityProp | AssociationProp,
        readonly isAssociation: boolean
    ) {
        super();
        if (prop instanceof EntityProp) {
            this._provider = prop.scalarProvider;
        } else {
            this._provider = undefined;
        }
    }

    override get scalarProvider(): ScalarProvider<any, any> | undefined {
        return this._provider;
    }

    accept(visitor: Visitor): void {
        visitor.visitPropExpr(this);
    }
}