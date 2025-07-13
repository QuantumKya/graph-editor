<script lang="ts">
    import { base } from '$app/paths';
    import { createEventDispatcher } from 'svelte';

    let mode = $state(2);
    let mode_icons: string[] = ['node_add.png', 'node_edit.png', 'node_drag.png', 'link.png'];

    const dispatch = createEventDispatcher();

    $effect(() => {
        dispatch('modeChanged', mode);
    });
</script>

<div class="flex absolute rounded-xl bg-neutral-200 border-blue-300 border-2 p-[15px] pt-[5px] pb-[5px] h-fit bottom-6 left-[50%] transform -translate-[50%]">
    {#each mode_icons as icon, i}
        <button class="p-2.5 rounded-xl border-none outline-none transition duration-200 hover:bg-blue-300 { mode === i ? 'bg-gray-500 mt-auto mb-auto' : 'mt-[10px] mb-[10px]' }"
            onclick={() => mode = i} >
            
            <img src="{base}/mode_icons/{icon}" alt={mode_icons[mode].split(".")[0]} class={ mode === i ? 'max-w-[40px] rounded-xl' : 'max-w-[30px] rounded-lg' }>
        </button>
    {/each}
</div>