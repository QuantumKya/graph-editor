<svelte:head>
    <style>
        body {
            background-color: #DDD;
            overflow-y: hidden;
        }
    </style>
</svelte:head>

<script lang="ts">
    let makelink: HTMLAnchorElement;
    let viewlink: HTMLAnchorElement;
</script>

<p class="absolute left-[50%] -translate-x-[calc(50%+175px)] top-[50%] -translate-y-[calc(50%+175px)] -rotate-[5deg] z-10 text-black text-5xl font-semibold">quantumKya's</p>

<img src="graph.png" alt="Graph" class="-z-10 absolute pointer-events-none left-[50%] -translate-x-[calc(50%-50px)] top-[50%] -translate-y-[calc(50%+100px)]">

<div class="absolute w-fit h-fit left-[50%] -translate-x-[50%] top-[50%] -translate-y-[50%] flex flex-row gap-10 text-2xl">
    <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-4 pb-2 pt-1 transition duration-200 hover:bg-gray-700"
    onclick={(e) => makelink.click()} aria-label="Make Graph">Make Graph</button>
    <a bind:this={makelink} class="hidden" aria-label="/make" href="/make"></a>
    <button class="bg-neutral-800 text-white border-blue-500 text-center rounded-xl border-2 w-fit p-4 pb-2 pt-1 transition duration-200 hover:bg-gray-700"
    onclick={(e) => viewlink.click()} aria-label="View Graph">View Graph</button>
    <a bind:this={viewlink} class="hidden" aria-label="/view" href="/view"></a>
</div>