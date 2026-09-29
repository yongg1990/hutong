<template>
  <div class="json-editor" :class="{ invalid: error }">
    <div class="editor-toolbar">
      <span class="editor-status" :class="{ invalid: error }">{{ error || (modelValue.trim() ? 'JSON 格式正确' : 'JSON') }}</span>
      <el-button text size="small" :disabled="!modelValue.trim()" @click="format">格式化</el-button>
    </div>
    <div class="editor-body">
      <div ref="gutter" class="line-numbers" aria-hidden="true"><span v-for="line in lineCount" :key="line">{{ line }}</span></div>
      <div class="code-area">
        <pre ref="highlight" class="highlight" aria-hidden="true"><code v-html="highlightedJson" /></pre>
        <textarea
          ref="input"
          :value="modelValue"
          :rows="rows"
          :placeholder="placeholder"
          :aria-invalid="Boolean(error)"
          :aria-label="label"
          wrap="off"
          spellcheck="false"
          @input="onInput"
          @scroll="syncScroll"
          @keydown.tab.prevent="indent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{ modelValue: string; rows?: number; placeholder?: string; label?: string }>(), {
  rows: 6,
  placeholder: '请输入 JSON',
  label: 'JSON 编辑器'
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const input = ref<HTMLTextAreaElement>();
const gutter = ref<HTMLElement>();
const highlight = ref<HTMLElement>();
const lineCount = computed(() => props.modelValue.split('\n').length);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
const highlightedJson = computed(() => {
  const source = props.modelValue;
  const token = /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b/g;
  let result = '';
  let cursor = 0;
  for (const match of source.matchAll(token)) {
    const index = match.index ?? 0;
    result += escapeHtml(source.slice(cursor, index));
    const value = match[0];
    const kind = value.startsWith('"') ? (/^\s*:/.test(source.slice(index + value.length)) ? 'key' : 'string') : /^-?\d/.test(value) ? 'number' : 'literal';
    result += `<span class="token-${kind}">${escapeHtml(value)}</span>`;
    cursor = index + value.length;
  }
  return result + escapeHtml(source.slice(cursor)) + '\n';
});
const error = computed(() => {
  if (!props.modelValue.trim()) return '';
  try { JSON.parse(props.modelValue); return ''; }
  catch (cause) { return cause instanceof Error ? cause.message : 'JSON 格式错误'; }
});
function onInput(event: Event) { emit('update:modelValue', (event.target as HTMLTextAreaElement).value); }
function syncScroll() {
  if (!input.value) return;
  if (gutter.value) gutter.value.scrollTop = input.value.scrollTop;
  if (highlight.value) { highlight.value.scrollTop = input.value.scrollTop; highlight.value.scrollLeft = input.value.scrollLeft; }
}
function format() {
  if (error.value) return;
  emit('update:modelValue', JSON.stringify(JSON.parse(props.modelValue), null, 2));
}
function indent(event: KeyboardEvent) {
  const target = event.target as HTMLTextAreaElement;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const value = props.modelValue;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  if (event.shiftKey) {
    const selection = value.slice(lineStart, end);
    const updated = selection.replace(/(^|\n)( {1,2}|\t)/g, '$1');
    emit('update:modelValue', value.slice(0, lineStart) + updated + value.slice(end));
    requestAnimationFrame(() => { target.selectionStart = Math.max(lineStart, start - (selection.length - updated.length)); target.selectionEnd = lineStart + updated.length; });
  } else if (start !== end && value.slice(start, end).includes('\n')) {
    const selection = value.slice(lineStart, end);
    const updated = '  ' + selection.replace(/\n/g, '\n  ');
    emit('update:modelValue', value.slice(0, lineStart) + updated + value.slice(end));
    requestAnimationFrame(() => { target.selectionStart = start + 2; target.selectionEnd = lineStart + updated.length; });
  } else {
    emit('update:modelValue', value.slice(0, start) + '  ' + value.slice(end));
    requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 2; });
  }
}
</script>

<style scoped>
.json-editor { width: 100%; min-width: 0; border: 1px solid var(--color-border); border-radius: 6px; background: #f8fbfa; overflow: hidden; }
.json-editor:focus-within { border-color: var(--color-brand); box-shadow: 0 0 0 3px rgba(15, 118, 110, .12); }
.json-editor.invalid { border-color: var(--color-danger); }
.editor-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 32px; padding: 0 8px 0 12px; border-bottom: 1px solid var(--color-border-subtle); background: #f2f7f5; }
.editor-status { color: var(--color-success); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.editor-status.invalid { color: var(--color-danger); }
.editor-body { display: flex; min-width: 0; }
.line-numbers, textarea, .highlight { padding: 10px 0; font: 12px/1.6 "JetBrains Mono", Consolas, monospace; letter-spacing: 0; }
.line-numbers { width: 38px; flex: none; overflow: hidden; text-align: right; color: var(--color-muted); background: #f2f7f5; user-select: none; }
.line-numbers span { display: block; padding-right: 8px; }
.code-area { position: relative; flex: 1; min-width: 0; }
.highlight, textarea { width: 100%; min-width: 0; min-height: 80px; margin: 0; padding: 10px 12px; border: 0; tab-size: 2; white-space: pre; overflow: auto; }
.highlight { position: absolute; inset: 0; pointer-events: none; color: var(--color-ink); }
.highlight :deep(.token-key) { color: #176b89; }
.highlight :deep(.token-string) { color: #9b4e2b; }
.highlight :deep(.token-number) { color: #7454a1; }
.highlight :deep(.token-literal) { color: #a34862; }
textarea { position: relative; display: block; outline: 0; resize: vertical; background: transparent; color: transparent; caret-color: var(--color-ink); -webkit-text-fill-color: transparent; }
textarea::selection { background: #b7dfda; -webkit-text-fill-color: var(--color-ink); }
textarea::placeholder { color: var(--color-muted); -webkit-text-fill-color: var(--color-muted); }
</style>
