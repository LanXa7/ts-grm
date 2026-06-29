import { AnyModel, IsDerivedModelOf, ModelName } from "../model";
import { AssociatedPropContract } from "../prop_contract";

export type RecursiveKeys<TModel extends AnyModel, TMembers> = 
    keyof {
        [K in keyof TMembers
            as IsRecursiveProp<TModel, TMembers[K]> extends true
                ? K & string
                : never
        ]: never
    };

type IsRecursiveProp<TModel extends AnyModel, TProp> =
    TProp extends AssociatedPropContract<infer TargetModel, any, any, any, any, any>
        ? Extends<TModel, TargetModel> extends true
            ? true
            : false
        : false;

type Extends<
    TModel1 extends AnyModel,
    TModel2 extends AnyModel
> =
    ModelName<TModel1> extends ModelName<TModel2>
        ? true
        : IsDerivedModelOf<TModel1, TModel2>;
