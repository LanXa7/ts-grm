import { AnyModel } from "../model";
import { __ContextKind, __DtoBody, __DtoType, __DtoKind } from "./dto_context";
import { __SelfMappings } from "./utils";

export interface __FoldContext<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers
> {

    $fold<
        TName extends string,
        const TMappings extends __SelfMappings<TModel>
    >(
        name: TName,
        body: __DtoBody<TModel, TDtoKind, TContextKind, TMembers, TMappings>
    ): __FoldMapping<TModel, TDtoKind, TName, TMappings>;
}

export interface __FoldMapping<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TName extends string,
    TMappings extends __SelfMappings<TModel>
> {

    readonly __mappingType: 'FOLD';
    readonly __model?: TModel;
    readonly __dtoKind?: TDtoKind;
    readonly __name?: TName;
    readonly __mappings?: TMappings;
}

export type __FoldDtoType<TMapping> =
    TMapping extends __FoldMapping<any, any, infer Name, infer Mappings>
        ? { [K in Name]: __DtoType<Mappings> }
        : never;