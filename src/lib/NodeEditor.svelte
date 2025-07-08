<script lang="ts">
    import { onMount } from 'svelte';

    import data from './nodes.json';
    const nodes = data["nodes"];

    const { node_id, saveNode, exitNode } = $props();
    const node = nodes[node_id];
    
    let nodeTitle: string = $state(node.name);
    let nodeDesc: string = $state(node.description);
    
    let nodeImage: string = $state(node.image);
    let imageupload: HTMLInputElement;

    let titletype: HTMLInputElement;
    let desctype: HTMLTextAreaElement;

    let saved: boolean = false;
    
    onMount(() => {
        titletype.value = node.name;
        desctype.value = node.description;
    });
</script>

<div id="panel">
    <input type="text" bind:this={titletype} bind:value={nodeTitle} class="text-input" placeholder="Node Title">

    <button id="image" onclick={(event) => { imageupload.click(); }}
    >Upload Image</button>
    <input type="file" accept="image/*" style:display="none" bind:this={imageupload} onchange={(event) => {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file: File = input.files[0];

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                nodeImage = reader.result;
            }
        };

        reader.readAsDataURL(file);
    }}
    />
    {#if nodeImage != ""}
        <img src={nodeImage} alt="Uploaded Icon" id="display-image"/>
    {:else}
        <img src="/landscape-placeholder.svg" alt="Uploaded Icon" id="display-image"/>
    {/if}

    <textarea rows="8" maxlength="400" bind:this={desctype} bind:value={nodeDesc} class="text-input" id="desc" placeholder="Node Description"></textarea>

    <button id="save" onclick={() => { saveNode(node_id, nodeTitle, nodeDesc, nodeImage); saved = true; }}
    >Save</button>

    <button id="exit" onclick={() => exitNode(saved)}
    >Exit</button>
</div>

<style>
    #panel {
        display: flex;
        flex-direction: column;
        gap: 15px;
        max-width: 350px;
        height: fit-content;

        background-color: #1e1e1e;
        color: #ffffff;
        padding: 10px;
        border-radius: 15px;
    }

    .text-input {
        font-family: monospace;

        background-color: #3e3e3f;
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 0.6em 1em;
        font-size: 1rem;
        outline: none;
        transition: background-color 0.3s, box-shadow 0.3s;
    }

    .text-input::placeholder {
        color: #aaa;
    }

    .text-input:focus {
        background-color: #2a2a2a;
        box-shadow: 0 0 0 2px #4A90E2;
    }

    #desc {
        resize: none;
        overflow: scroll;
    }

    button {
        background-color: rgba(20, 20, 20, 1);
        color: #ffffff;
        border-color: #4A90E2;
        text-align: center;
        padding: 4px 7.5px 7.5px 7.5px;
        border-radius: 10px;

        right: 0px;
        max-width: fit-content;
    }

    #display-image {
        width: 300px;
        border-radius: 10px;
    }
</style>