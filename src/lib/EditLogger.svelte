<script lang="ts">
    import { onMount } from "svelte";

    let editLog: string[] = $state([]);
    let logArea: HTMLTextAreaElement;
    
    let backPace: number = $state(0);
    let actionLog: string[] = $state([]);

    export const log = (action: string, detail?: string) => {
        backPace = 0;
        actionLog.push(action);
        editLog.push((detail === undefined) ? action : action + ":\n\t" + detail);
    };
    
    export const undo = () => {
        if (backPace > actionLog.length - 2) return;
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

<div class="flex flex-col gap-0 absolute w-fit p-1 rounded-xl bottom-1 left-1 font-mono text-blue-300 bg-gray-700">
    <p class="text-center"> ------------------ Edit Log ------------------ </p>
    
    <textarea class="resize-none h-[200px] max-h-[350px] overflow-y-scroll text-wrap outline-none"
        readonly cols=48
        bind:this={logArea}>
    </textarea>
</div>