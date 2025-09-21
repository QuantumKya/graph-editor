<script lang="ts">
    import { base } from '$app/paths';
    import { createEventDispatcher } from 'svelte';

    let mode = $state(2);
    let mode_icons: string[] = [
        'node_add.png',
        'node_edit.png',
        'node_drag.png',
        '',
        'link_add.png',
        'link_edit.png',
    ];

    const dispatch = createEventDispatcher();

    $effect(() => {
        dispatch('modeChanged', mode);
    });
</script>

<div class="flex absolute rounded-xl bg-neutral-200 border-blue-300 border-2 p-[10px] pt-[5px] pb-[5px] h-fit bottom-6 left-[50%] transform -translate-[50%]">
    {#each mode_icons as icon, i}
        {#if icon === ''}
            <div class="w-[5px] bg-neutral-300 rounded-full m-3"></div>
        {:else}
            <button class="p-2.5 rounded-xl border-none outline-none transition duration-200 hover:bg-blue-300 { mode === i - mode_icons.slice(0, i).filter((str) => str === '').length ? 'bg-gray-500 mt-auto mb-auto' : 'mt-[10px] mb-[10px]' }"
                onclick={() => mode = i - mode_icons.slice(0, i).filter((str) => str === '').length} >
                
                <img src="{base}/mode_icons/{icon}" alt={mode_icons[i].split(".")[0]} class={ mode === i - mode_icons.slice(0, i).filter((str) => str === '').length ? 'max-w-[40px] rounded-xl' : 'max-w-[30px] rounded-lg' }>
            </button>
        {/if}
    {/each}
</div>