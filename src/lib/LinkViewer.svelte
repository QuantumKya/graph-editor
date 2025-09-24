<script lang="ts">
    import { btnstyle } from "$lib";


    let { initPos = $bindable(), link, open = $bindable() } = $props();



</script>

<div class="flex flex-col gap-3.5 max-w-[350px] min-w-10 min-h-10 h-fit bg-neutral-950 text-white p-2.5 rounded-xl z-10 absolute left-[{initPos.x}px] bottom-[{initPos.y}px]">
    <p class="font-mono text-lg bg-neutral-800 text-white rounded-xl p-2 pl-3">{link.name}</p>

    <div class="relative inline-block h-fit">
        <button class="{btnstyle} float-right"
            onclick={() => open = false}
        >Exit</button>
    </div>
</div>