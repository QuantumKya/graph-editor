<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';

    let mode = $state(0);
    let modes: string[] = ['add', 'edit', 'drag', 'link'];
    let mode_icons: string[] = ['node_add.png', 'node_edit.png', 'node_drag.png', 'link.png'];
</script>

<div class="flex absolute rounded-xl bg-neutral-200 border-blue-300 border-2 p-[15px] pt-[5px] pb-[5px] h-fit bottom-8 left-[calc(50%-55px)]">
    {#each modes as m, i}
        <button class="p-2.5 rounded-xl border-none outline-none transition duration-200 hover:bg-blue-300 { mode === i ? 'bg-gray-500' : '' }"
            class:mt-[10px]="{ mode !== i }"
            class:mb-[10px]="{ mode !== i }"
            class:mt-auto="{ mode === i }"
            class:mb-auto="{ mode === i }"
            onclick={(event) => mode = i} >

            <img src="{base}/mode_icons/{mode_icons[i]}" alt=""
                class:max-w-[40px]="{ mode === i }"
                class:max-w-[30px]="{ mode !== i }"
                class:rounded-xl="{ mode === i }"
                class:rounded-lg="{ mode !== i }"
            >
        </button>
    {/each}
</div>