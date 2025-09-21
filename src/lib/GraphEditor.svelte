<script lang="ts">
    import { onMount } from 'svelte';
    
    import NodeEditor from './NodeEditor.svelte';
    import ModePicker from './ModePicker.svelte';

    import Victor from 'victor';
    import graphData from './nodes.json';
    import EditLogger from './EditLogger.svelte';
    import UndoRedo from './UndoRedo.svelte';
    import LinkEditor from './LinkEditor.svelte';

    type MNode = typeof graphData["nodes"][0];
    type MLink = typeof graphData["links"][0];

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

    let focusLink: MLink = $state(graphData["links"][0]);
    let editingLink: boolean = $state(false);

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

        ctx.setTransform(zoom, 0, 0, zoom, -translation.x, -translation.y);

        if (linkingNode) {
            ctx.beginPath();
            ctx.moveTo(focusNode.position[0], focusNode.position[1]);
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

    const getScreenMousePos = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return new Victor(event.clientX - rect.left, event.clientY - rect.top);
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

        let link = data["links"].find(lnk => {
            const n1 = data["nodes"][lnk.from];
            const n2 = data["nodes"][lnk.to];
            return findDistance(Victor.fromArray(n1.position), Victor.fromArray(n2.position), pos) < 10;
        });
        focusLink = link ?? focusLink;
        const link_id = data["links"].indexOf(focusLink);
        
        // toolbar action
        if (event.button === 0) {
            // node adding
            if (mode === 0) {
                if (!node) {
                    data["nodes"].push({ id: -1, name: "", image: "", position: pos.toArray() });
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
            // link adding
            else if (mode === 3) {
                if (node) {
                    if (linkingNode) {
                        if (linkNode.id === focusNode.id) return;
                        if (data["links"].filter(lnk => (lnk.from === linkNode.id && lnk.to === focusNode.id) || (lnk.from === focusNode.id && lnk.to === linkNode.id)).length !== 0) return;
                        data["links"].push({ from: linkNode.id, to: focusNode.id, name: "", description: "" });
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
                else { if (!link) return;
                    data["links"].splice(link_id, 1);

                    update();
                    logger.log("Delete link", `node ${linkNode.id} -> ${focusNode.id}`);
                }
            }
            // link editing
            else if (mode === 4) { if (!link) return;
                editingLink = true;
            }
        }
        // dragging canvas
        if (event.button === 2) {
            draggingCanvas = true;
            dragStartMouse = getScreenMousePos(event);
            dragStartTranslation = translation.clone();
        }
    };

    const onmousemove = (event: MouseEvent) => {
        if (editingNode) return;
        
        const worldPos = getMousePos(event);
        lastMousePos = worldPos;

        if (draggingNode) {
            let node = data["nodes"].find(n => n.id === focusNode.id);
            if (!node) throw new Error("uhhh focusNode error, it's not in the list...");
            node.position = worldPos.clone().subtract(dragOffset).toArray();
        }
        else if (draggingCanvas) {
            const pos = getScreenMousePos(event);
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

        const screenPos = getScreenMousePos(event);
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
    };

    
    const saveNode = (node: MNode, title: string, img: string): boolean => {
        let checkArray = [
            node.name === title ? "" : "name",
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
        node.image = img;

        const index = data.nodes.indexOf(node);
        if (index >= 0) {
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
        if (!window.confirm("Save this node with new contents?")) return false;
        
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

    
    const saveGraph = () => {
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
    };

    let graphupload: HTMLInputElement;


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
            <NodeEditor node={focusNode} {saveNode} {exitNode} />
        {:else if (editingLink)}
            <LinkEditor link={focusLink} {saveLink} {exitLink} />
        {/if}
    </div>

    <div class="absolute right-2.5 bottom-2.5">
        <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700" aria-label="Save Graph"
        onclick={saveGraph}>Save Graph</button>
        <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700" aria-label="Load Graph"
        onclick={(event) => graphupload.click()}>Load Graph</button>
        <input type="file" accept=".json" style:display="none" bind:this={graphupload} onchange={(event) => {
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
                    } catch (e: Error | any) {
                        alert("Failed to load graph: " + e.message);
                    }
                }
            };

            reader.readAsText(file);
        }}
        />
    </div>

    <EditLogger bind:this={logger} />

    <UndoRedo {undo} {redo} />

    <ModePicker on:modeChanged={(e) => mode = e.detail} />
</div>