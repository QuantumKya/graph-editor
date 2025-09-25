<svelte:head>
    <title>Graph Editor</title>
    <style>
        body {
            overflow-y: hidden;
        }
    </style>
</svelte:head>

<svelte:document {onkeydown}></svelte:document>

<script lang="ts">
    import { onMount } from 'svelte';
    
    import { btnstyle, cloneDatum, findDistance, getMousePos, getScreenMousePos, type GraphData } from '$lib';
    import Victor from 'victor';

    import NodeEditor from '$lib/NodeEditor.svelte';
    import ModePicker from '$lib/ModePicker.svelte';
    import EditLogger from '$lib/EditLogger.svelte';
    import LinkEditor from '$lib/LinkEditor.svelte';
    import UndoRedo from '$lib/UndoRedo.svelte';
    import Controls from '$lib/Controls.svelte';

    type MNode = GraphData["nodes"][0];
    type MLink = GraphData["links"][0];

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
        const newFocus = data["nodes"].findIndex(n => n.id === focusNode);
        focusNode = newFocus;
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
    let viewPos: Victor = $state(new Victor(0, 0));

    let dragOffset: Victor = new Victor(0, 0);

    let data: GraphData = $state({ nodes: [ { "id": 0, "name": "Node", "description": "", "image": "", "position": [200, 300] } ], links: [] });
    let stateBuffer: GraphData[] = $state([{ nodes: [ { "id": 0, "name": "Node", "description": "", "image": "", "position": [200, 300] } ], links: [] }]);
    let backPace: number = $state(1);

    let imageBuffer: HTMLImageElement[] = [];

    let focusNode: number = $state(-1);
    let draggingNode: boolean = $state(false);
    let editingNode: boolean = $state(false);

    let focusLink: number = $state(-1);
    let editingLink: boolean = $state(false);

    let linkNode: MNode;
    let linkingNode: boolean = $state(false);

    let mode: number = $state(0);

    let logger: EditLogger;

    const draw = () => {
        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("DRAW LOOP - ctx is null");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.setTransform(zoom, 0, 0, zoom, -translation.x, -translation.y);

        if (linkingNode) {
            ctx.beginPath();
            ctx.moveTo(data.nodes[focusNode].position[0], data.nodes[focusNode].position[1]);
            ctx.lineTo(lastMousePos.x, lastMousePos.y);
            ctx.lineWidth = 10;
            ctx.strokeStyle = `rgba(0, 0, 0, 0.35)`;
            ctx.stroke();
        }

        data["links"].forEach((link) => {
            ctx.beginPath();
            const node1 = data["nodes"].find(node => node.id === link["from"]) ?? data["nodes"][0];
            const node2 = data["nodes"].find(node => node.id === link["to"]) ?? data["nodes"][0];
            ctx.moveTo(node1.position[0], node1.position[1]);
            ctx.lineTo(node2.position[0], node2.position[1]);
            ctx.lineWidth = 10;
            ctx.strokeStyle = "black";
            ctx.stroke();
        });

        data["nodes"].forEach((node, index) => {
            const pos = Victor.fromArray(node.position);
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

    const onmousedown = (event: MouseEvent) => {
        if (editingNode || editingLink) return;

        const pos = getMousePos(event, canvas, translation, zoom);
        let node = data["nodes"].find(
            node => Victor.fromArray(node.position).distanceSq(pos) < 400
        );
        if (node) focusNode = node.id;

        let link = data["links"].find(lnk => {
            const n1 = data["nodes"][lnk.from];
            const n2 = data["nodes"][lnk.to];
            return findDistance(Victor.fromArray(n1.position), Victor.fromArray(n2.position), pos) < 10;
        });
        if (link) focusLink = data.links.indexOf(link);
        
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
                    focusNode = -1;
                    imageBuffer.splice(id, 1);

                    let killList: number[] = [];
                    data["links"].forEach((link, i) => {
                        if (link.from === id || link.to === id) {
                            killList.push(i);
                        }
                    });
                    data.links = data.links.filter((link, i) => !killList.includes(i));

                    updateIDs();
                    update();
                    logger.log("Delete node", `Node ID: ${id}, ${killList.length} links destroyed`);
                }
            }
            // node editing
            else if (mode === 1) { if (!node) return;
                editingNode = true;
                viewPos = getScreenMousePos(event, canvas);
            }
            // node dragging
            else if (mode === 2) { if (!node) return;
                dragOffset = pos.clone().subtract(Victor.fromArray(data.nodes[focusNode].position));
                draggingNode = true;
            }
            // link adding
            else if (mode === 3) {
                if (node) {
                    if (linkingNode) {
                        if (linkNode.id === focusNode) return;
                        if (data["links"].filter(lnk => (lnk.from === linkNode.id && lnk.to === focusNode) || (lnk.from === focusNode && lnk.to === linkNode.id)).length !== 0) return;
                        data["links"].push({ from: linkNode.id, to: focusNode, name: "", description: "" });
                        linkingNode = false;

                        update();
                        logger.log("Create link", `node ${linkNode.id} -> ${focusNode}`);
                    }
                    else {
                        linkNode = node;
                        linkingNode = true;
                        lastMousePos = pos;
                    }
                }
                else { if (!link) return;
                    data["links"].splice(focusLink, 1);

                    update();
                    logger.log("Delete link", `node ${linkNode.id} -> ${focusNode}`);
                }
            }
            // link editing
            else if (mode === 4) { if (!link) return;
                editingLink = true;
                viewPos = getScreenMousePos(event, canvas);
            }
        }
        // dragging canvas
        if (event.button === 2) {
            draggingCanvas = true;
            dragStartMouse = getScreenMousePos(event, canvas);
            dragStartTranslation = translation.clone();
        }
    };

    const onmousemove = (event: MouseEvent) => {
        if (editingNode || editingLink) return;
        
        const worldPos = getMousePos(event, canvas, translation, zoom);
        lastMousePos = worldPos;

        if (draggingNode) {
            let node = data["nodes"].find(n => n.id === focusNode);
            if (!node) throw new Error("uhhh focusNode error, it's not in the list...");
            node.position = worldPos.clone().subtract(dragOffset).toArray();
        }
        else if (draggingCanvas) {
            const pos = getScreenMousePos(event, canvas);
            const dMouse = pos.clone().subtract(dragStartMouse);
            translation = dragStartTranslation.clone().subtract(dMouse);
        }
    };

    const onmouseup = (event: MouseEvent) => {
        if (editingNode || editingLink) return;

        if (draggingNode) {
            draggingNode = false;

            update();
            logger.log("Set node position");
        }
        draggingCanvas = false;
    };
    
    const onwheel = (event: WheelEvent) => {
        event.preventDefault();

        const screenPos = getScreenMousePos(event, canvas);
        const world = screenPos.clone().add(translation).divideScalar(zoom);

        const change = Math.sign(event.deltaY);
        zoom -= change * 0.125;
        zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

        const worldNew = world.clone().multiplyScalar(zoom).subtract(screenPos);
        translation = worldNew;
    };

    const onkeydown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            if (linkingNode) linkingNode = false;
        }

        if (event.ctrlKey) {
            if (event.key === "o") { event.preventDefault(); graphupload.click(); }
            if (event.key === "s") { event.preventDefault(); saveGraph(); }
            if (event.key === "z") undo();
            if (event.key === "y") redo();
            if (event.shiftKey && event.key === "s") { event.preventDefault(); saveImage(); }
        }
    };

    
    const saveNode = (node: MNode, title: string, desc: string, img: string): boolean => {
        let checkArray = [
            node.name === title ? "" : "name",
            node.description === desc ? "" : "description",
            node.image === img ? "" : "image"
        ];
        
        let strArray: string[] = [];
        checkArray.forEach((check) => {
            if (check !== "") strArray.push(check);
        });
        const checkString = strArray.join(", ");

        if (checkString === "") return false;
        if (!window.confirm("Save this node with new contents?")) return false;
        
        node.name = title;
        node.description = desc;
        node.image = img;

        const index = data.nodes.indexOf(node);
        if (index !== -1) {
            imageBuffer[index].src = node.image;
        }

        update();
        logger.log("Update node contents", checkString);
        return true;
    };
    
    const exitNode = (saved: boolean, changed: boolean) => {
        if (!saved && changed) if (!window.confirm("Stop editing without saving?")) return;
        editingNode = false;
    };

    const saveLink = (link: MLink, title: string, desc: string) => {
        let checkArray = [
            link.name === title ? "" : "name",
            link.description === desc ? "" : "description"
        ];
        
        let strArray: string[] = [];
        checkArray.forEach((check) => {
            if (check !== "") strArray.push(check);
        });
        const checkString = strArray.join(", ");

        if (checkString === "") return false;
        if (!window.confirm("Save this link with new contents?")) return false;
        
        link.name = title;
        link.description = desc;

        update();
        logger.log("Update node contents", checkString);
        return true;
    };

    const exitLink = (saved: boolean, changed: boolean) => {
        if (!saved && changed) if (!window.confirm("Stop editing without saving?")) return;
        editingLink = false;
    };


    const update = () => {
        if (backPace > 1) {
            stateBuffer.splice(-backPace + 1, backPace - 1);
            backPace = 1;
        }
        stateBuffer.push(cloneDatum(data));
    };

    let undoable = $derived(backPace < stateBuffer.length);
    let redoable = $derived(backPace > 1);

    const undo = () => {
        if (editingNode || editingLink) return;

        if (!undoable) return;
        backPace++;
        setState();
        logger.undo();
    };

    const redo = () => {
        if (editingNode || editingLink) return;

        if (!redoable) return;
        backPace--;
        setState();
        logger.redo();
    };

    
    const loadGraph = (event: Event) => {
        if (editingNode || editingLink) return;

        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file: File = input.files[0];

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                try {
                    const json = JSON.parse(reader.result);
                    if (!json.nodes || !json.links) throw new Error("Invalid graph data");
                    data = cloneDatum(json);
                    updateIDs();
                    backPace = 1;
                    stateBuffer = [cloneDatum(data)];
                    setState();
                    logger.log("Load new graph data");
                }
                catch (e: Error | any) {
                    alert("Failed to load graph: " + e.message);
                }
            }
        };

        reader.readAsText(file);
    };
    
    const saveGraph = () => {
        if (window.confirm("Download new JSON?")) {
            const json = JSON.stringify(data, null, 4);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graph.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const saveImage = () => {
        if (window.confirm("Download image? It will look as your canvas does now.")) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'graph.png';
            link.click();
        }
    };

    let graphupload: HTMLInputElement;
    let modepicker: ModePicker;


    const updateIDs = () => {
        if (editingNode || editingLink) return;
        
        const key = new Map(data["nodes"].map((node, i) => [node.id, i]));
        data["nodes"].forEach((node, i) => node.id = i);
        data["links"].forEach(link => {
            link.from = key.get(link.from) ?? link.from;
            link.to = key.get(link.to) ?? link.to;
        });
    };

    onMount(() => {
        const img = new Image();
        img.src = '';
        imageBuffer = [img];
        draw();
    });
</script>

<div id="canvas-box" class="relative inline-block overflow-hidden">

    <canvas class="bg-neutral-100" tabindex="0" class:cursor-grabbing={draggingNode || draggingCanvas}
        bind:this={canvas}
        {onmousemove} {onmousedown} {onmouseup} {onwheel}
        oncontextmenu={event => event.preventDefault()}
    ></canvas>

    <div class="absolute z-10"
    style="left: {viewPos.x}px; top: {viewPos.y}px;">
        {#if (editingNode)}
            <NodeEditor node={data.nodes[focusNode]} {saveNode} {exitNode} />
        {:else if (editingLink)}
            <LinkEditor link={data.links[focusLink]} {saveLink} {exitLink} />
        {/if}
    </div>

    <div class="absolute right-2.5 bottom-2.5">
        <button class="{btnstyle}" aria-label="Save Image"
        onclick={saveImage}>Save Image</button>
        <button class="{btnstyle}" aria-label="Save Graph"
        onclick={saveGraph}>Save Graph</button>
        <button class="{btnstyle}" aria-label="Load Graph"
        onclick={(event) => graphupload.click()}>Load Graph</button>
        <input type="file" accept=".json" style:display="none" bind:this={graphupload} onchange={loadGraph}/>
    </div>

    
    <EditLogger bind:this={logger} />
    
    <UndoRedo {undo} {redo} bind:undoable={undoable} bind:redoable={redoable} />
    
    <ModePicker modeChanged={(m: number) => mode = m} bind:this={modepicker} />
    
    <Controls bind:mode={mode} controls={{
        "Right Click and Drag": "move viewport",
        "Scroll Wheel": "zoom in and out",
        "Ctrl-Z": "undo",
        "Ctrl-Y": "redo",
        "Ctrl-O": "open graph",
        "Ctrl-S": "save graph",
        "Ctrl-Shift-S": "save graph as image"
    }}/>
</div>