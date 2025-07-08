<script lang="ts">
    import { onMount } from 'svelte';
    import NodeEditor from './NodeEditor.svelte';

    import data from './nodes.json';
    import Victor from 'victor';

    type MNode = { "id": number, "name": string, "description": string, "image": string, "position": number[] };

    let canvas: HTMLCanvasElement;

    let translation: Victor = new Victor(0, 0);
    let zoom: number = 1;

    let draggingCanvas: boolean = false;
    let lastMousePos: Victor = new Victor(0, 0);

    let dragOffset: Victor = new Victor(0, 0);

    let node_data = data["nodes"];
    let link_data = data["links"];

    let focusingNode: MNode | null;
    let editPanelComp: { node_id: number };
    let editingNode: boolean = false;

    let editPanel: any;

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        node_data.forEach((node) => {
            ctx.beginPath();
            ctx.arc(
                (node.position[0] - translation.x) / zoom,
                (node.position[1] - translation.y) / zoom,
                20,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = "black";
            ctx.fill();
        });

        link_data.forEach((link) => {
            ctx.beginPath();
            const node1 = node_data[link["from"]];
            const node2 = node_data[link["to"]];
            ctx.moveTo((node1.position[0] - translation.x) / zoom, (node1.position[1] - translation.y) / zoom);
            ctx.lineTo((node2.position[0] - translation.x) / zoom, (node2.position[1] - translation.y) / zoom);
            ctx.lineWidth = 7.5;
            ctx.strokeStyle = "black";
            ctx.stroke();
        });
    }

    const getMousePos = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left + translation.x) / zoom;
        const y = (event.clientY - rect.top + translation.y) / zoom;
        return new Victor(x, y);
    };

    const onMouseDown = (event: MouseEvent) => {
        if (editingNode) return;

        const pos = getMousePos(event);
        focusingNode = node_data.find(
            node => Victor.fromArray(node.position).distance(pos) < 20
        ) ?? null;
        
        if (event.button === 0) {
            if (focusingNode) {
                dragOffset = pos.clone().subtract(Victor.fromArray(focusingNode.position));
            }
            else {
                draggingCanvas = true;
                lastMousePos = pos;
            }
        }
        else if (event.button === 1) {
            if (focusingNode) {
                editingNode = true;
                editPanel = NodeEditor;
                editPanelComp = { node_id: focusingNode.id };
            }
        }
    }

    const onMouseMove = (event: MouseEvent) => {
        if (editingNode) return;

        const pos = getMousePos(event);

        if (focusingNode) {
            focusingNode.position = pos.clone().subtract(dragOffset).toArray();
        }
        else if (draggingCanvas) {
            const dMouse = pos.clone().subtract(lastMousePos);
            translation.subtract(dMouse);
        }
    }

    const onMouseUp = (event: MouseEvent) => {
        if (editingNode) return;

        focusingNode = null;
        draggingCanvas = false;
    }

    onMount(() => {
        setInterval(draw, 1000 / 30, canvas.getContext("2d"));
        canvas.onmousedown = onMouseDown;
        canvas.onmousemove = onMouseMove;
        canvas.onmouseup = onMouseUp;

        canvas.addEventListener('contextmenu', event => event.preventDefault()); 
    });
</script>

<canvas bind:this={canvas} width="1700" height="800"></canvas>
<svelte:component this={editPanel} style="right: 10px; top: 10px;" {...editPanelComp}/>

<style>
    canvas {
        background-color: #d4d4d4;
    }

    canvas:active {
        cursor: grabbing;
    }
</style>