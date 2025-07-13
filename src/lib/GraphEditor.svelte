<script lang="ts">
    import { onMount } from 'svelte';
    
    import NodeEditor from './NodeEditor.svelte';
    import ModePicker from './ModePicker.svelte';

    import Victor from 'victor';
    import data from './nodes.json';
    import EditLogger from './EditLogger.svelte';
  import UndoRedo from './UndoRedo.svelte';

    type MNode = { "id": number, "name": string, "description": string, "image": string, "position": number[] };

    let canvas: HTMLCanvasElement;

    let translation: Victor = new Victor(0, 0);
    let zoom: number = 1;
    const minZoom: number = 0.5;
    const maxZoom: number = 2;

    let draggingCanvas: boolean = $state(false);
    let dragStartMouse: Victor;
    let dragStartTranslation: Victor;
    
    let lastMousePos: Victor;

    let dragOffset: Victor = new Victor(0, 0);

    let node_data = data["nodes"];
    let link_data = data["links"];

    let imageBuffer: HTMLImageElement[];

    let focusNode: MNode = $state(node_data[0]);
    let draggingNode: boolean = $state(false);
    let editingNode: boolean = $state(false);

    let linkNode: MNode;
    let linkingNode: boolean = $state(false);

    let mode: number = 0;

    let logger: EditLogger;

    const draw = () => {
        imageBuffer = node_data.map(node => { let img = new Image(); img.src = node.image; return img; });

        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("DRAW LOOP - ctx is null");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (linkingNode) {
            ctx.beginPath();
            ctx.moveTo(focusNode.position[0] - translation.x, focusNode.position[1] - translation.y);
            ctx.lineTo(lastMousePos.x, lastMousePos.y);
            ctx.lineWidth = 10;
            ctx.strokeStyle = `rgba(0, 0, 0, 0.35)`;
            ctx.stroke();
        }

        link_data.forEach((link) => {
            ctx.beginPath();
            const node1 = node_data[link["from"]];
            const node2 = node_data[link["to"]];
            ctx.moveTo(node1.position[0] - translation.x, node1.position[1] - translation.y);
            ctx.lineTo(node2.position[0] - translation.x, node2.position[1] - translation.y);
            ctx.lineWidth = 10;
            ctx.strokeStyle = "black";
            ctx.stroke();
        });

        node_data.forEach((node, index) => {
            imageBuffer[index].src = node.image;
            
            const pos = Victor.fromArray(node.position).subtract(translation);
            const imgWidth = 25;

            ctx.beginPath();
            ctx.arc(
                pos.x, pos.y,
                20,
                0, Math.PI * 2
            );
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.drawImage(imageBuffer[index], pos.x - imgWidth / 2, pos.y - imgWidth / 2, imgWidth, imgWidth);
        });

        requestAnimationFrame(draw);
    };

    const getMousePos = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left + translation.x) / zoom;
        const y = (event.clientY - rect.top + translation.y) / zoom;
        return new Victor(x, y);
    };

    const findDistance = (l1: Victor, l2: Victor, p: Victor): number => {
        const seg = l2.clone().subtract(l1);
        const pointPointer = p.clone().subtract(l1);

        const project = pointPointer.dot(seg) / seg.lengthSq();

        if (project < 0 || project > 1) return 1e6;

        const parallelogramArea = Math.abs(l2.clone().subtract(l1).cross(p.clone().subtract(l1)));
        const base = l2.clone().subtract(l1).length();
        return parallelogramArea / base;
    };

    const onmousedown = (event: MouseEvent) => {
        if (editingNode) return;

        const pos = getMousePos(event);
        let node = node_data.find(
            node => Victor.fromArray(node.position).distanceSq(pos) < 400
        );
        focusNode = node ?? focusNode;
        
        // toolbar action
        if (event.button === 0) {
            // node editing
            if (mode === 1) { if (!node) return;
                editingNode = true;
            }
            // node dragging
            else if (mode === 2) { if (!node) return;
                dragOffset = pos.clone().subtract(Victor.fromArray(focusNode.position));
                draggingNode = true;
            }
            // link editing
            else if (mode === 3) {
                if (node) {
                    if (linkingNode) {
                        if (linkNode.id === focusNode.id) return;
                        link_data.push({ from: linkNode.id, to: focusNode.id });
                        linkingNode = false;
                        logger.log("Create link", `node ${linkNode.id} -> ${focusNode.id}`);
                    }
                    else {
                        linkNode = node;
                        linkingNode = true;
                        lastMousePos = pos;
                    }
                }
                else {
                    const link_id = link_data.findIndex(lnk => {
                        const n1 = node_data[lnk.from];
                        const n2 = node_data[lnk.to];
                        return findDistance(Victor.fromArray(n1.position), Victor.fromArray(n2.position), pos) < 10;
                    });
                    if (link_id !== -1) link_data.splice(link_id, 1);
                }
            }
        }
        // dragging canvas
        if (event.button === 2) {
            draggingCanvas = true;
            dragStartMouse = pos;
            dragStartTranslation = translation;
        }
    };

    const onmousemove = (event: MouseEvent) => {
        if (editingNode) return;
        
        const pos = getMousePos(event);
        lastMousePos = pos;

        if (draggingNode) {
            let node = node_data.find(n => n.id === focusNode.id);
            if (node === undefined) throw new Error("uhhh focusNode error, it's not in the list...");
            else {
                node.position = pos.clone().subtract(dragOffset).toArray();
            }
        }
        else if (draggingCanvas) {
            const dMouse = pos.clone().subtract(dragStartMouse);
            translation = dragStartTranslation.clone().subtract(dMouse);
        }
    };

    const onmouseup = (event: MouseEvent) => {
        if (editingNode) return;

        draggingNode = false;
        draggingCanvas = false;
    };
    
    const onwheel = (event: WheelEvent) => {
        event.preventDefault();
        
        /*
        const change = Math.sign(event.deltaY);

        zoom -= change * 0.125;
        zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
        */
    };

    const onkeydown = (event: KeyboardEvent) => {
        if (event.key == "Escape") {
            if (linkingNode) linkingNode = false;
        }
    };

    
    const saveNode = (id: number, title: string, desc: string, img: string): boolean => {
        if (!window.confirm("Save this node with new contents?")) return false;

        node_data[id].name = title;
        node_data[id].description = desc;
        node_data[id].image = img;
        return true;
    };
    
    const exitNode = (saved: boolean, changed: boolean) => {
        if (!saved && changed) if (!window.confirm("Stop editing without saving?")) return;
        editingNode = false;
    };

    const undo = () => {
        logger.undo();
    };

    const redo = () => {
        logger.redo();
    };

    onMount(draw);
</script>

<div id="canvas-box" class="relative inline-block overflow-hidden">

    <canvas class="bg-neutral-100" class:cursor-grabbing={draggingNode || draggingCanvas}
        bind:this={canvas}
        {onmousemove} {onmousedown} {onmouseup} {onkeydown} {onwheel}
        oncontextmenu={event => event.preventDefault()}
    ></canvas>

    <div class="absolute right-2.5 top-2.5">
        {#if (editingNode)}
            <NodeEditor node_id={focusNode.id} {saveNode} {exitNode} />
        {/if}
    </div>

    <EditLogger bind:this={logger} />

    <UndoRedo {undo} {redo} />

    <ModePicker on:modeChanged={(e) => mode = e.detail} />
</div>