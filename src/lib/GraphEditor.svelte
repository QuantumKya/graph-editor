<script lang="ts">
    import { onMount } from 'svelte';
    
    import NodeEditor from './NodeEditor.svelte';
    import ModePicker from './ModePicker.svelte';

    import Victor from 'victor';
    import graphData from './nodes.json';
    import EditLogger from './EditLogger.svelte';
    import UndoRedo from './UndoRedo.svelte';

    type MNode = typeof graphData["nodes"][0];

    const cloneDatum = (datum: typeof graphData) => {
        return {
            nodes: datum.nodes.map(node => ({ ...node, position: [...node.position] })),
            links: datum.links.map(link => ({ ...link }))
        };
    };

    const setState = () => {
        const state = stateBuffer.at(-backPace) ?? data;
        data = cloneDatum(state);

        if (imageBuffer.length !== data["nodes"].length) {
            while (imageBuffer.length < data["nodes"].length) {
                imageBuffer.push(new Image());
            }
            while (imageBuffer.length > data["nodes"].length) {
                imageBuffer.pop();
            }
        }
        data["nodes"].forEach((node, i) => {
            imageBuffer[i].src = node.image;
        });
        const newFocus = data["nodes"].find(n => n.id === focusNode.id);
        if (newFocus) focusNode = newFocus;
        else focusNode = data["nodes"][0];
    };

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

    let data = $state(cloneDatum(graphData));
    let stateBuffer: (typeof graphData)[] = [cloneDatum(graphData)];
    let backPace: number = 1;

    let imageBuffer: HTMLImageElement[] = [];

    let focusNode: MNode = $state(graphData["nodes"][0]);
    let draggingNode: boolean = $state(false);
    let editingNode: boolean = $state(false);

    let linkNode: MNode;
    let linkingNode: boolean = $state(false);

    let mode: number = 0;

    let logger: EditLogger;

    const draw = () => {
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

        data["links"].forEach((link) => {
            ctx.beginPath();
            const node1 = data["nodes"].find(node => node.id === link["from"]) ?? data["nodes"][0];
            const node2 = data["nodes"].find(node => node.id === link["to"]) ?? data["nodes"][0];
            ctx.moveTo(node1.position[0] - translation.x, node1.position[1] - translation.y);
            ctx.lineTo(node2.position[0] - translation.x, node2.position[1] - translation.y);
            ctx.lineWidth = 10;
            ctx.strokeStyle = "black";
            ctx.stroke();
        });

        data["nodes"].forEach((node, index) => {
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
        let node = data["nodes"].find(
            node => Victor.fromArray(node.position).distanceSq(pos) < 400
        );
        focusNode = node ?? focusNode;
        
        // toolbar action
        if (event.button === 0) {
            // node adding
            if (mode === 0) {
                if (!node) {
                    data["nodes"].push({ id: -1, name: "", description: "", image: "", position: pos.toArray() });
                    updateIDs();
                    imageBuffer.push(new Image());
                    update();
                    logger.log("Create node");
                }
                else if (window.confirm("Delete node and its links?")) {
                    const id = node.id;
                    data["nodes"].splice(id, 1);
                    focusNode = data["nodes"][0];
                    imageBuffer.splice(id, 1);

                    let killList: number[] = [];
                    data["links"].forEach((link, i) => {
                        if (link.from === id || link.to === id) {
                            killList.push(i);
                        }
                    });
                    for (const i of killList) data["links"].splice(i, 1);

                    updateIDs();
                    update();
                    logger.log("Delete node", `Node ID: ${id}, ${killList.length} links destroyed`);
                }
            }
            // node editing
            else if (mode === 1) { if (!node) return;
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
                        data["links"].push({ from: linkNode.id, to: focusNode.id });
                        linkingNode = false;

                        update();
                        logger.log("Create link", `node ${linkNode.id} -> ${focusNode.id}`);
                    }
                    else {
                        linkNode = node;
                        linkingNode = true;
                        lastMousePos = pos;
                    }
                }
                else {
                    const link_id = data["links"].findIndex(lnk => {
                        const n1 = data["nodes"][lnk.from];
                        const n2 = data["nodes"][lnk.to];
                        return findDistance(Victor.fromArray(n1.position), Victor.fromArray(n2.position), pos) < 10;
                    });
                    if (link_id !== -1) {
                        data["links"].splice(link_id, 1);

                        update();
                        logger.log("Delete link", `node ${linkNode.id} -> ${focusNode.id}`);
                    }
                }
            }
        }
        // dragging canvas
        if (event.button === 2) {
            draggingCanvas = true;
            dragStartMouse = pos;
            dragStartTranslation = translation.clone();
        }
    };

    const onmousemove = (event: MouseEvent) => {
        if (editingNode) return;
        
        const pos = getMousePos(event);
        lastMousePos = pos;

        if (draggingNode) {
            let node = data["nodes"].find(n => n.id === focusNode.id);
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

        if (draggingNode) {
            draggingNode = false;

            update();
            logger.log("Set node position");
        }
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
        if (event.key === "Escape") {
            if (linkingNode) linkingNode = false;
        }

        if (event.key === "o") {
            if (window.confirm("Download new JSON?")) {
                const json = JSON.stringify(data, null, 4);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'data.json';
                a.click();
                URL.revokeObjectURL(url);
            }
        }
    };

    
    const saveNode = (id: number, title: string, desc: string, img: string): boolean => {
        let checkArray = [
            data["nodes"][id].name === title ? "" : "name", 
            data["nodes"][id].description === desc ? "" : "description",
            data["nodes"][id].image === img ? "" : "image"
        ];
        
        let strArray: string[] = [];
        checkArray.forEach((check) => {
            if (check !== "") strArray.push(check);
        });
        const checkString = strArray.join(", ");

        if (checkString === "") return false;
        if (!window.confirm("Save this node with new contents?")) return false;
        
        data["nodes"][id].name = title;
        data["nodes"][id].description = desc;
        data["nodes"][id].image = img;

        update();
        logger.log("Update node contents", checkString);
        return true;
    };
    
    const exitNode = (saved: boolean, changed: boolean) => {
        if (!saved && changed) if (!window.confirm("Stop editing without saving?")) return;
        editingNode = false;
    };


    const update = () => {
        if (backPace > 1) {
            stateBuffer.splice(-backPace + 1, backPace - 1);
            backPace = 1;
        }
        stateBuffer.push(cloneDatum(data));
        console.log(stateBuffer);
        console.log(backPace);
    };

    const undo = () => {
        if (backPace > stateBuffer.length - 1) return;
        backPace++;
        setState();
        logger.undo();
        console.log(stateBuffer);
        console.log(backPace);
    };

    const redo = () => {
        if (backPace < 2) return;
        backPace--;
        setState();
        logger.redo();
        console.log(stateBuffer);
        console.log(backPace);
    };


    const updateIDs = () => {
        const key = new Map(data["nodes"].map((node, i) => [node.id, i]));
        data["nodes"].forEach((node, i) => node.id = i);
        data["links"].forEach(link => {
            console.log(`${link.from}, ${link.to}`);
            link.from = key.get(link.from) ?? link.from;
            link.to = key.get(link.to) ?? link.to;
            console.log(`${link.from}, ${link.to}`);
        });
    };

    onMount(() => {
        imageBuffer = data["nodes"].map(node => { let img = new Image(); img.src = node.image; return img; });
        draw();
    });
</script>

<div id="canvas-box" class="relative inline-block overflow-hidden">

    <canvas class="bg-neutral-100" tabindex="0" class:cursor-grabbing={draggingNode || draggingCanvas}
        bind:this={canvas}
        {onmousemove} {onmousedown} {onmouseup} {onkeydown} {onwheel}
        oncontextmenu={event => event.preventDefault()}
    ></canvas>

    <div class="absolute right-2.5 top-2.5">
        {#if (editingNode)}
            <NodeEditor node_id={focusNode.id} {saveNode} {exitNode} nodes={data["nodes"]} />
        {/if}
    </div>

    <EditLogger bind:this={logger} />

    <UndoRedo {undo} {redo} />

    <ModePicker on:modeChanged={(e) => mode = e.detail} />
</div>