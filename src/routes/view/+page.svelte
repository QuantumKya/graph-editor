<script lang="ts">
    import { cloneDatum, getMousePos, getScreenMousePos, type GraphData } from "$lib";
    import Controls from "$lib/Controls.svelte";
    import { onMount } from "svelte";
    import Victor from "victor";

    let canvas: HTMLCanvasElement;

    let translation: Victor = new Victor(0, 0);
    let zoom: number = 1;
    const minZoom: number = 0.5;
    const maxZoom: number = 2;

    let draggingCanvas: boolean = $state(false);
    let dragStartMouse: Victor;
    let dragStartTranslation: Victor;

    let data: GraphData = $state({ nodes: [ { "id": 0, "name": "Node", "image": "", "position": [200, 300] } ], links: [] });
    
    let lastMousePos: Victor;

    let imageBuffer: HTMLImageElement[] = [];

    

    const draw = () => {
        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("DRAW LOOP - ctx is null");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.setTransform(zoom, 0, 0, zoom, -translation.x, -translation.y);

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
            if (node.image !== '') ctx.drawImage(imageBuffer[index], pos.x - imgWidth / 2, pos.y - imgWidth / 2, imgWidth, imgWidth);
        });

        requestAnimationFrame(draw);
    };

    const onmousedown = (event: MouseEvent) => {
        const pos = getMousePos(event, canvas, translation, zoom);
        
        // dragging canvas
        if (event.button === 0) {
            draggingCanvas = true;
            dragStartMouse = getScreenMousePos(event, canvas);
            dragStartTranslation = translation.clone();
        }
    };

    const onmousemove = (event: MouseEvent) => {
        const worldPos = getMousePos(event, canvas, translation, zoom);
        lastMousePos = worldPos;

        if (draggingCanvas) {
            const pos = getScreenMousePos(event, canvas);
            const dMouse = pos.clone().subtract(dragStartMouse);
            translation = dragStartTranslation.clone().subtract(dMouse);
        }
    };

    const onmouseup = (event: MouseEvent) => {
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
        if (event.ctrlKey) {
            if (event.key === "o") { event.preventDefault(); graphupload.click(); }
            if (event.key === "s") { event.preventDefault(); saveGraph(); }
        }
    };

    const setState = () => {
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
    };

    const loadGraph = (event: Event) => {
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
                    setState();
                }
                catch (e: Error | any) {
                    alert("Failed to load graph: " + e.message);
                }
            }

            console.log(data);
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

    let graphupload: HTMLInputElement;

    onMount(() => {
        draw();
    });
</script>

<canvas class="bg-neutral-100 w-full h-full" tabindex="0" class:cursor-grabbing={draggingCanvas}
    bind:this={canvas}
    {onmousemove} {onmousedown} {onmouseup} {onkeydown} {onwheel}
    oncontextmenu={event => event.preventDefault()}
></canvas>

<div class="absolute right-2.5 bottom-2.5">
    <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700" aria-label="Save Image"
    onclick={saveImage}>Save Image</button>
    <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700" aria-label="Save Graph"
    onclick={saveGraph}>Save Graph</button>
    <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700" aria-label="Load Graph"
    onclick={(event) => graphupload.click()}>Load Graph</button>
    <input type="file" accept=".json" style:display="none" bind:this={graphupload} onchange={loadGraph}/>
</div>

<Controls mode={-1} controls={{
    "Left Click and Drag": "move viewport",
    "Scroll Wheel": "zoom in and out"
}} />