<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';

    const { link, saveLink, exitLink } = $props();

    let linkTitle = $state('');
    let linkDesc = $state('');

    let titletype: HTMLInputElement;
    let desctype: HTMLTextAreaElement;

    let saved: boolean = false;
    let changed: boolean = false;

    onMount(() => {
        titletype.value = link.name;
        desctype.value = link.description;
    });

    const onchange = () => {
        changed = true;
    };

    const btn_css = "bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-2 pt-1 transition duration-200 hover:bg-gray-700";
    const text_input_css = "font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3 transition duration-300 focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none";
</script>

<div class="flex flex-col gap-3.5 max-w-[350px] h-fit bg-neutral-950 text-white p-2.5 rounded-xl">
    <input type="text" class="{text_input_css}" placeholder="Link Title"
        {onchange}
        bind:this={titletype}
        bind:value={linkTitle}
    >

    <textarea rows="6" maxlength="400" class="{text_input_css} placeholder:text-neutral-400 resize-none overflow-scroll" placeholder="Link Description"
        {onchange}
        bind:this={desctype}
        bind:value={linkDesc}
    ></textarea>

    <div class="relative inline-block h-fit">
        <button class="{btn_css} float-left"
            onclick={() => { saved = saveLink(link, linkTitle, linkDesc); }}
        >Save</button>
        
        <button class="{btn_css} float-right"
            onclick={() => exitLink(saved, changed)}
        >Exit</button>
    </div>
</div>