<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { btnstyle, txtstyle } from '$lib';

    const { node, saveNode, exitNode } = $props();
    
    let nodeTitle: string = $state(node.name);
    let nodeDesc: string = $state(node.description);
    /*
    let linkAddend: string = $state('');
    let wikiLink: string = $derived.by(() => {
        if (nodeTitle.length === 0 ) return '';
        let name = nodeTitle;
        name = name.at(0)?.toUpperCase() + name.slice(1).toLowerCase();
        let arr = name.split(' ');
        return arr.join('_');
    });
    */
    
    let nodeImage: string = $state(node.image);
    let imageupload: HTMLInputElement;

    let titletype: HTMLInputElement;
    let desctype: HTMLTextAreaElement;

    let changed: boolean = false;
    let saved: boolean = false;
    
    onMount(() => {
        titletype.value = node.name;
    });

    const onchange = () => {
        changed = true;
    };
</script>

<div class="flex flex-col gap-3.5 max-w-[350px] h-fit bg-neutral-950 text-white p-2.5 rounded-xl">
    <input type="text" class="{txtstyle}" placeholder="Node Title"
        {onchange}
        bind:this={titletype}
        bind:value={nodeTitle}
    >

    <textarea rows="6" maxlength="400" class="{txtstyle} placeholder:text-neutral-400 resize-none overflow-scroll" placeholder="Link Description"
        {onchange}
        bind:this={desctype}
        bind:value={nodeDesc}
    ></textarea>

    {#if nodeImage != ""}
        <img src={nodeImage} alt="Uploaded Icon" class="rounded-lg w-[150px]"/>
    {:else}
        <img src="{base}/landscape-placeholder.svg" alt="Uploaded Icon" class="rounded-lg w-[150px]"/>
    {/if}
    <button class="{btnstyle}" onclick={(event) => { imageupload.click(); }}
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
        onchange();
    }}
    />

    <!--
    <input type="text" class="{text_input_css}" placeholder="Link Addend"
        {onchange}
        bind:this={addendtype}
        bind:value={linkAddend}
    >

    <a href="https://en.wikipedia.org/wiki/{wikiLink}" class="underline">Wikipedia</a>
    -->
    

    <div class="relative inline-block h-fit">
        <button class="{btnstyle} float-left"
            onclick={() => { saved = saveNode(node, nodeTitle, nodeImage); }}
        >Save</button>
        
        <button class="{btnstyle} float-right"
            onclick={() => exitNode(saved, changed)}
        >Exit</button>
    </div>
</div>