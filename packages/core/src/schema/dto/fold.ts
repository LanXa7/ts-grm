import { AnyModel } from "../model";
import { ContextKind, DtoBody, DtoType, DtoKind } from "./common";
import { SelfMappings } from "./utils";

export interface FoldContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TContextKind extends ContextKind,
    TMembers
> {

    $fold<
        TName extends string,
        const TMappings extends SelfMappings<TModel>
    >(
        name: TName,
        body: DtoBody<TModel, TDtoKind, TContextKind, TMembers, TMappings>
    ): FoldMapping<TModel, TDtoKind, TName, TMappings>;
}

export interface FoldMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TName extends string,
    TMappings extends SelfMappings<TModel>
> {

    readonly __mappingType: 'FOLD';
    readonly __model?: TModel;
    readonly __dtoKind?: TDtoKind;
    readonly __name?: TName;
    readonly __mappings?: TMappings;
}

export type FoldDotType<TMapping> =
    TMapping extends FoldMapping<any, any, infer Name, infer Mappings>
        ? { [K in Name]: DtoType<Mappings> }
        : never;