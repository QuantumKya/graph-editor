<script lang="ts">
    let { undo, redo, undoable = $bindable(), redoable = $bindable() } = $props();

    const btn_css = "border-none rounded-full w-fit h-fit p-2 pt-0.5 pb-1 text-center";
</script>

<div class="flex flex-row gap-3 w-min h-min p-3 absolute top-1 left-1 text-2xl pointer-events-none">
    <button class="{btn_css} {undoable ? "bg-gray-300" : "bg-gray-400"} pointer-events-auto" onclick={undo} aria-label="Undo">
        <i class="fas fa-undo"></i>
    </button>

    <button class="{btn_css} {redoable ? "bg-gray-300" : "bg-gray-400"} pointer-events-auto" onclick={redo} aria-label="Redo">
        <i class="fas fa-redo"></i>
    </button>
</div>