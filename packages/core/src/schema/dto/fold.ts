import { AnyModel } from "../model";
import { ContextKind, DtoBody, DtoMapping, DtoType, DtoKind } from "./common";

export interface FoldContext<
    TModel extends AnyModel,
    TMembers,
    TContextKind extends ContextKind
> {

    $fold<
        TName extends string,
        const TMappings extends SelfMappings<TModel>
    >(
        name: TName,
        body: DtoBody<TModel, TMembers, TContextKind, TMappings>
    ): FoldMapping<TModel, TName, TMappings>;
}

type SelfMappings<
    TModel extends AnyModel, 
> = ReadonlyArray<DtoMapping<TModel>>;

export interface FoldMapping<
    TModel extends AnyModel,
    TName extends string,
    TMappings extends SelfMappings<TModel>
> {

    readonly __mappingType: 'FOLD';
    readonly __model?: TModel;
    readonly __name?: TName;
    readonly __mappings?: TMappings;
}

export type FoldDotType<TMapping, TDtoKind extends DtoKind> =
    TMapping extends FoldMapping<any, infer Name, infer Mappings>
        ? { [K in Name]: DtoType<Mappings, TDtoKind> }
        : never;