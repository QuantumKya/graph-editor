<script lang="ts">
  import { onMount } from "svelte";

    let editLog: string[] = $state([]);
    let logArea: HTMLTextAreaElement;

    export const log = (msg: string) => editLog.push(msg);
    $effect(() => { logArea.value += '\n' + editLog.at(-1); });
    
    onMount(() => {
        logArea.value = "";
        log(" ------------------ Edit Log ------------------ \n");
    });
</script>

<textarea class="resize-none absolute h-[200px] max-w-[500px] max-h-[450px] rounded-xl overflow-y-scroll text-wrap font-mono text-blue-300 bg-gray-700 bottom-1 left-1"
    readonly cols=48
    bind:this={logArea}>
</textarea>