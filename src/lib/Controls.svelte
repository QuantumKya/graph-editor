<script lang="ts">

    const depcontrols = [
        {
            "Left Click": "create a new node",
            "Left Click (on existing node)": "delete selected node",
        },
        {
            "Left Click (on existing node)": "edit node contents"
        },
        {
            "Left Click and Drag": "move node"
        },
        {
            "Left Click (on Node A)": "start new edge from node",
            "Left Click (on node, once started edge)": "add new edge",
            "Escape": "cancel new edge"
        },
        {
            "Left Click (on existing edge)": "edit edge contents"
        }
    ];
    const depctrlnames = [
        "Add Node",
        "Edit Node",
        "Move Node",
        "Add Edge",
        "Edit Edge"
    ]
    const controls = {
        "Ctrl-Z": "undo",
        "Ctrl-Y": "redo",
        "Ctrl-S": "save",
        "Ctrl-O": "open"
    };


    let { mode = $bindable() } = $props();

    let open: boolean = $state(true);
    let menu: HTMLDivElement;
    let menubody: HTMLDivElement;

</script>

<div class="absolute right-1 top-1 transition duration-200" bind:this={menu}>
    <div bind:this={menubody} class="bg-neutral-200 border-blue-300 border-4 p-3 pr-10 pb-6 rounded-lg">
        <h1 class="text-2xl">Controls</h1>
        {#each Object.entries(controls) as [key, value]}
            <p class="pl-2"><strong>{key}</strong> — {value}</p>
        {/each}
        <br>
        <h2>Mode-Specific Controls — {depctrlnames[mode]}</h2>
        {#each Object.entries(depcontrols[mode]) as [key, value]}
            <p class="pl-2"><strong>{key}</strong> — {value}</p>
        {/each}
    </div>

    {#if open}
    <button onclick={(event) => { open = false; menu.style.top = `-${menubody.offsetHeight}px` }} aria-label="Close Menu"><i class="fa-solid fa-chevron-up"></i></button>
    {:else}
    <button onclick={(event) => { open = true; menu.style.top = '4px'; }} aria-label="Open Menu"><i class="fa-solid fa-chevron-down"></i></button>
    {/if}
</div>