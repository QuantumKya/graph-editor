<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';

    const { nodes, node_id, saveNode, exitNode } = $props();
    const node = nodes[node_id];
    
    let nodeTitle: string = $state(node.name);
    let linkAddend: string = $state('');
    let wikiLink: string = $derived.by(() => {
        if (nodeTitle.length === 0 ) return '';
        let name = nodeTitle;
        name = name.at(0)?.toUpperCase() + name.slice(1).toLowerCase();
        let arr = name.split(' ');
        if (linkAddend !== '') arr.push(linkAddend);
        return arr.join('_');
    });
    
    let nodeImage: string = $state(node.image);
    let imageupload: HTMLInputElement;

    let titletype: HTMLInputElement;
    let addendtype: HTMLInputElement;
    //let desctype: HTMLTextAreaElement;

    let changed: boolean = false;
    let saved: boolean = false;
    
    onMount(() => {
        titletype.value = node.name;
        addendtype.value = node.addend;
        //desctype.value = node.description;
    });

    const onchange = () => {
        changed = true;
    };

    const btn_css = "bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700";
    const text_input_css = "font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3 transition duration-300 focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none";
</script>

<div class="flex flex-col gap-3.5 max-w-[350px] h-fit bg-neutral-950 text-white p-2.5 rounded-xl">
    <input type="text" class="{text_input_css}" placeholder="Node Title"
        {onchange}
        bind:this={titletype}
        bind:value={nodeTitle}
    >


    <button class="{btn_css}" onclick={(event) => { imageupload.click(); }}
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
    {#if nodeImage != ""}
        <img src={nodeImage} alt="Uploaded Icon" class="rounded-lg w-[300px]"/>
    {:else}
        <img src="{base}/landscape-placeholder.svg" alt="Uploaded Icon" class="rounded-lg w-[300px]"/>
    {/if}

    <!--
    <textarea rows="6" maxlength="400" class="{text_input_css} placeholder:text-neutral-400 resize-none overflow-scroll" placeholder="Node Description"
        {onchange}
        bind:this={desctype}
        bind:value={nodeDesc}
    ></textarea>
    -->

    <input type="text" class="{text_input_css}" placeholder="Link Addend"
        {onchange}
        bind:this={addendtype}
        bind:value={linkAddend}
    >

    <a href="https://en.wikipedia.org/wiki/{wikiLink}" class="underline">Wikipedia</a>
    

    <div class="relative inline-block h-fit">
        <button class="{btn_css} float-left"
            onclick={() => { saved = saveNode(node_id, nodeTitle, linkAddend, nodeImage); }}
        >Save</button>
        
        <button class="{btn_css} float-right"
            onclick={() => exitNode(saved, changed)}
        >Exit</button>
    </div>
</div>