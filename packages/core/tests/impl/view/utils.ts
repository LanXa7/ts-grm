import { DataReader } from "@/impl/data_reader";
import { DtoMapper } from "@/impl/dto_mapper";

export function mapperJson(mapper: DtoMapper): any {
    const json = {
        entity: mapper.entity.name,
        associatedProp: mapper.associatedProp?.toString(),
        fields: mapper.fields.map(f => {
            return {
                prop: f.prop.toString(),
                paths: f.paths,
                subMapper: f.subMapper != null
                    ? mapperJson(f.subMapper)
                    : undefined,
                recursiveDepth: f.recursiveDepth,
                dependencies: f.dependencies,
                isDependent: f.isDependent ? true : undefined,
                columnIndex: f.columnIndex
            };
        })
    } as any;
    function removeUndefinedValues(o: any): any {
        if (typeof o !== "object") {
            return o;
        }
        if (Array.isArray(o)) {
            return o.map(e => removeUndefinedValues(e));
        }
        const n = {} as any;
        for (const k in o) {
            const v = removeUndefinedValues(o[k]);
            if (v !== undefined) {
                n[k] = v;
            }
        }
        return n;
    }
    return removeUndefinedValues(json);
}

export function makeReader(...args: any[]): DataReader {
    return new class implements DataReader {
        next(): boolean {
            throw new Error("Unsupported Operation Error");
        }
        get(index: number): any {
            return args[index];
        }
    }
}