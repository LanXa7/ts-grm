import { NodeRender } from "./fun_render";

export interface Driver {

    readonly name: string;

    readonly nodeRender: NodeRender;
}