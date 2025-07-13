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
        log(" ------------------ Edit Log ------------------ \n");
    });
</script>

<textarea class="resize-none absolute h-[200px] max-w-[500px] max-h-[450px] rounded-xl overflow-y-scroll text-wrap font-mono text-blue-300 bg-gray-700 bottom-1 left-1"
    readonly cols=48
    bind:this={logArea}>
</textarea>