<script lang="ts">
    import { onMount } from 'svelte';
    import { btnstyle, txtstyle } from '$lib';

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
</script>

<div class="flex flex-col gap-3.5 max-w-[350px] h-fit bg-neutral-950 text-white p-2.5 rounded-xl">
    <input type="text" class="{txtstyle}" placeholder="Link Title"
        {onchange}
        bind:this={titletype}
        bind:value={linkTitle}
    >

    <textarea rows="6" maxlength="400" class="{txtstyle} placeholder:text-neutral-400 resize-none overflow-scroll" placeholder="Link Description"
        {onchange}
        bind:this={desctype}
        bind:value={linkDesc}
    ></textarea>

    <div class="relative inline-block h-fit">
        <button class="{btnstyle} float-left"
            onclick={() => { saved = saveLink(link, linkTitle, linkDesc); }}
        >Save</button>
        
        <button class="{btnstyle} float-right"
            onclick={() => exitLink(saved, changed)}
        >Exit</button>
    </div>
</div>