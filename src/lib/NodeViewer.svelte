<script lang="ts">
    import { btnstyle } from "$lib";


    let { node, open = $bindable() } = $props();



</script>

<div class="flex flex-col gap-3.5 max-w-[350px] bg-neutral-950 text-white p-2.5 rounded-xl">

    {#if node.from === undefined}
        <textarea rows=1 readonly placeholder="Node Name"
        class="font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3 placeholder:text-neutral-400 resize-none overflow-scroll"
        >{node.name}</textarea>

        <textarea rows=5 readonly placeholder="Node Description"
        class="font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3 placeholder:text-neutral-400 resize-none overflow-scroll focus:outline-none"
        >{node.description}</textarea>
    {:else}
        <textarea rows=1 readonly placeholder="Link Name"
        class="font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3 placeholder:text-neutral-400 resize-none overflow-scroll"
        >{node.name}</textarea>

        <textarea rows=5 readonly placeholder="Link Description"
        class="font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3 placeholder:text-neutral-400 resize-none overflow-scroll focus:outline-none"
        >{node.description}</textarea>
    {/if}

    <div class="relative inline-block h-fit">
        <button class="{btnstyle} float-right"
            onclick={() => open = false}
        >Exit</button>
    </div>
</div>