<script lang="ts">
    import { onMount } from "svelte";

    let editLog: string[] = $state([]);
    let logArea: HTMLTextAreaElement;
    
    let backPace: number = $state(0);
    let actionLog: string[] = $state([]);

    let open: boolean = $state(true);
    let menu: HTMLDivElement;

    export const log = (action: string, detail?: string) => {
        if (backPace > 0) {
            editLog.splice(-backPace, backPace);
            backPace = 0;
        }
        actionLog.push(action);
        editLog.push((detail === undefined) ? action : action + ":\n\t" + detail);
    };
    
    export const undo = () => {
        if (backPace > actionLog.length - 1) return;
        backPace++;
        editLog.push("Undo: " + actionLog.at(-backPace));
    };
    
    export const redo = () => {
        if (backPace < 1) return;
        editLog.push("Redo: " + actionLog.at(-backPace));
        backPace--;
    };

    $effect(() => {
        logArea.value += '\n' + editLog.at(-1);
        logArea.scrollTop = logArea.scrollHeight;
    });
    
    onMount(() => {
        logArea.value = "";
    });
</script>

<div class="absolute bottom-1 left-1 transition duration-200" bind:this={menu}>
    {#if open}
    <button onclick={(event) => { open = false; menu.style.bottom = `-225px` }} aria-label="Close Menu"><i class="fa-solid fa-chevron-down"></i></button>
    {:else}
    <button onclick={(event) => { open = true; menu.style.bottom = '4px'; }} aria-label="Open Menu"><i class="fa-solid fa-chevron-up"></i></button>
    {/if}

    <div class="flex flex-col gap-0 w-fit p-1 rounded-xl font-mono text-blue-300 bg-gray-700">
        <p class="text-center"> ------------------ Edit Log ------------------ </p>
        
        <textarea class="resize-none overflow-y-scroll text-wrap outline-none"
            readonly cols=48 rows=8
            bind:this={logArea}>
        </textarea>
    </div>
    
</div>
