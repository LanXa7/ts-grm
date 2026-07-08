import { AnyModel } from "../model";
import { ContextKind, DtoBody, DtoMapping, DtoType, DtoKind } from "./common";

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

type SelfMappings<
    TModel extends AnyModel, 
> = ReadonlyArray<DtoMapping<TModel>>;

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