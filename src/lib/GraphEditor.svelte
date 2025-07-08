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
    let editingNode: boolean = false;

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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

        node_data.forEach((node) => {
            const image: HTMLImageElement = new Image();
            image.src = node.image;
            
            const pos = Victor.fromArray(node.position).subtract(translation).divideScalar(zoom);
            const imgWidth = 25 / zoom;

            ctx.beginPath();
            ctx.arc(
                pos.x, pos.y,
                20 / zoom,
                0, Math.PI * 2
            );
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.drawImage(image, pos.x - imgWidth / 2, pos.y - imgWidth / 2, imgWidth, imgWidth);
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
        else if (event.button === 2) {
            if (focusingNode) {
                editingNode = true;
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

<div id="canvas-box">
    <canvas bind:this={canvas} width="1700" height="800"></canvas>
    <div id="edit-panel">
        {#if (editingNode && focusingNode)}
            <NodeEditor node_id={focusingNode.id}
            saveNode={(id: number, title: string, desc: string, img: string) => {
                if (!window.confirm("Save this node with new contents?")) return;

                node_data[id].name = title;
                node_data[id].description = desc;
                node_data[id].image = img;
            }}
            exitNode={(saved: boolean) => {
                if (!saved) if (!window.confirm("Stop editing without saving?")) return;
                editingNode = false;

                focusingNode = null;
            }} />
        {/if}
    </div>
</div>

<style>
    canvas {
        background-color: #d4d4d4;
    }

    canvas:active {
        cursor: grabbing;
    }

    #canvas-box {
        position: relative;
        display: inline-block;
    }

    #edit-panel {
        position: absolute;
        right: 10px;
        top: 10px;
    }
</style>