import { AnyModel } from "@/schema/model";
import { __CriteriaHelper, __CriteriaInstanceOfBinding, __CriteriaMembers } from "./criteria_internal_types";
import { __AllModelMembers, __DeclaredModelMembers, __DerivedModel } from "@/index_internal";

export type Criteria<TModel extends AnyModel> =
    __CriteriaMembers<TModel, __AllModelMembers<TModel>, "NONNULL">;

class CriteriaHelperImpl implements __CriteriaHelper {
    instanceOf<
        TSuperMdel extends AnyModel,
        TDrivedModel extends AnyModel,
    >(
        model: TSuperMdel,
        derivedModel: __DerivedModel<TDrivedModel, TSuperMdel>,
        criteria: __CriteriaMembers<TDrivedModel, __DeclaredModelMembers<TDrivedModel>, "NONNULL">
    ): __CriteriaInstanceOfBinding<TSuperMdel, TDrivedModel> {
        return {
            superModel: model,
            derivedModel,
            criteria
        };
    }
}

export const criteria: __CriteriaHelper = new CriteriaHelperImpl();