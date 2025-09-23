// place files you want to import through the `$lib` alias in this folder.

import Victor from "victor";

export type GraphData = { nodes: { id: number, name: string, image: string, position: number[] }[], links: { from: number, to: number, name: string, description: string }[] };

export const cloneDatum = (datum: GraphData): GraphData => {
    return {
        nodes: datum.nodes.map(node => ({ ...node, position: [...node.position] })),
        links: datum.links.map(link => ({ ...link }))
    };
};

export const getScreenMousePos = (event: MouseEvent, cnvs: HTMLCanvasElement) => {
    const rect = cnvs.getBoundingClientRect();
    return new Victor(event.clientX - rect.left, event.clientY - rect.top);
};

export const getMousePos = (event: MouseEvent, cnvs: HTMLCanvasElement, translation: Victor, zoom: number) => {
    const rect = cnvs.getBoundingClientRect();
    const x = (event.clientX - rect.left + translation.x) / zoom;
    const y = (event.clientY - rect.top + translation.y) / zoom;
    return new Victor(x, y);
};

export const findDistance = (l1: Victor, l2: Victor, p: Victor): number => {
    const seg = l2.clone().subtract(l1);
    const pointPointer = p.clone().subtract(l1);

    const project = pointPointer.dot(seg) / seg.lengthSq();

    if (project < 0 || project > 1) return 1e6;

    const parallelogramArea = Math.abs(l2.clone().subtract(l1).cross(p.clone().subtract(l1)));
    const base = l2.clone().subtract(l1).length();
    return parallelogramArea / base;
};