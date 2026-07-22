import { AnyModel } from "@/schema/model";
import { __CriteriaHelper, __CriteriaInstanceOfBinding, __CriteriaMembers } from "./criteria_internal_types";
import { __AllModelMembers, __DeclaredModelMembers, __DerivedModel } from "@/index_internal";
import { suppressUnused } from "@/utils";

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
        suppressUnused(model);
        suppressUnused(derivedModel);
        suppressUnused(criteria);
        throw new Error();
    }
}

export const criteria: __CriteriaHelper = new CriteriaHelperImpl();