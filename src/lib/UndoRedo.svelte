<script lang="ts">
    

    let { undo, redo } = $props();

    const btn_css = "border-none rounded-full w-fit h-fit bg-gray-300 p-2 pt-0.5 pb-1 text-center";
</script>

<div class="flex flex-row gap-3 w-min h-min p-3 absolute top-1 left-1 text-2xl">
    <button class="{btn_css}" onclick={undo} aria-label="Undo">
        <i class="fas fa-undo"></i>
    </button>

    <button class="{btn_css}" onclick={redo} aria-label="Redo">
        <i class="fas fa-redo"></i>
    </button>
</div>