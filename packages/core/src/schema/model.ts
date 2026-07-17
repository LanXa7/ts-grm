import { ModelContextImpl, ModelImpl } from "@/impl/model_impl";
import { 
    Ctor, 
    CtorMembers, 
    InheritanceModelCreator, 
    MakeAllModelMembers, 
    ModelContext, 
    ModelCreator, 
    ModelName, 
    ModelSuperNames, 
    SuperIdKey 
} from "./model_internal_types";

export const model: ModelCreator = modelImpl();

function modelImpl(): ModelCreator {

    function create<
        TName extends string, 
        TIdKey extends keyof CtorMembers<TCtor> & string,
        TCtor extends Ctor
    >(
        name: TName,
        idKey: TIdKey,
        ctor: TCtor,
        configurator?: (ctx: ModelContext<TCtor, never>) => void
    ): Model<TName, TIdKey, TCtor, CtorMembers<TCtor>, never> {
        const ctx = new ModelContextImpl<TCtor, never>();
        if (configurator != null) {
            configurator(ctx);
        }
        return new ModelImpl(name, idKey, ctor, undefined, ctx.toModelOptions());
    }

    function ext<
        TSuperModel extends AnyModel
    >(
        superModel: TSuperModel
    ): InheritanceModelCreator<TSuperModel> {
        return <
            TName extends string, 
            TCtor extends Ctor
        >(
            name: TName,
            ctor: TCtor,
            configurator?: (ctx: ModelContext<TCtor, TSuperModel>) => void
        ): Model<
            TName, 
            SuperIdKey<TSuperModel>, 
            TCtor, 
            MakeAllModelMembers<TCtor, TSuperModel>,
            ModelName<TSuperModel> | ModelSuperNames<TSuperModel>
        > => {
            const ctx = new ModelContextImpl<TCtor, TSuperModel>();
            if (configurator != null) {
                configurator(ctx);
            }
            return new ModelImpl<
                TName, 
                SuperIdKey<TSuperModel>, 
                TCtor, 
                MakeAllModelMembers<TCtor, TSuperModel>,
                ModelName<TSuperModel> | ModelSuperNames<TSuperModel>
            >(
                name, 
                undefined, 
                ctor, 
                superModel,
                ctx.toModelOptions()
            );
        }
    }
    create.extends = ext;
    return create as any as ModelCreator;
}

export interface Model<
    TName extends string, 
    TIdKey extends string = string,
    TCtor extends Ctor = Ctor,
    TAllMembers extends object = object,
    TSuperNames extends string | never = never
> {
    __type(): {
        model: [TName, TIdKey, TCtor, TAllMembers, TSuperNames] | true
    }
}

export type AnyModel = Model<any, any, any, any, any>;

export const TB_INHERIT = Symbol("<inherit>");

export const DV_ABSTRACT = Symbol("<abstract>");

export const DV_MODEL_NAME = Symbol("<modelName>");