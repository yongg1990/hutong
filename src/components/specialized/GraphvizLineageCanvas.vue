<template>
  <div class="graphviz-canvas-wrapper">
    <div class="canvas-toolbar">
      <div class="toolbar-left">
        <span class="pulse-node"></span>
        <span class="title">血缘关系图</span>
        <span class="spec-label">{{ normalizedNodes.length }} 节点 / {{ normalizedEdges.length }} 条边</span>
      </div>
      <div class="tool-actions">
        <el-button size="small" @click="zoomIn">放大 (+)</el-button>
        <el-button size="small" @click="zoomOut">缩小 (-)</el-button>
        <el-button size="small" @click="resetZoom">重置 100%</el-button>
      </div>
    </div>

    <div v-if="normalizedNodes.length" class="canvas-stage-wrapper">
      <div class="canvas-stage" :style="{ transform: `scale(${zoomScale})`, width: `${canvasWidth}px` }">
        <svg class="lineage-svg" :width="canvasWidth" height="420" :viewBox="`0 0 ${canvasWidth} 420`">
          <defs>
            <marker id="lineage-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0e5f40" />
            </marker>
          </defs>
          <g v-for="edge in renderedEdges" :key="edge.key">
            <line :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" stroke="#0e5f40" stroke-width="2" marker-end="url(#lineage-arrow)" />
            <text v-if="edge.label" :x="(edge.x1 + edge.x2) / 2" :y="edge.y1 - 10" text-anchor="middle" font-size="11" fill="#4a6155">{{ edge.label }}</text>
          </g>
          <g
            v-for="node in renderedNodes"
            :key="node.id"
            class="graph-node"
            :transform="`translate(${node.x}, ${node.y})`"
            @click="emit('node-click', { ...node.raw, id: node.id, label: node.label, type: node.type })"
          >
            <rect width="170" height="82" rx="6" fill="#ffffff" stroke="#0e5f40" stroke-width="1.8" />
            <rect width="170" height="6" rx="3" fill="#0e5f40" />
            <text x="85" y="31" text-anchor="middle" font-size="12" font-weight="700" fill="#12211b">{{ node.shortLabel }}</text>
            <text x="85" y="52" text-anchor="middle" font-size="11" fill="#4a6155">{{ node.shortId }}</text>
            <text x="85" y="70" text-anchor="middle" font-size="10" fill="#0e5f40">{{ node.type }}</text>
          </g>
        </svg>
      </div>
    </div>
    <el-empty v-else description="查询后显示血缘节点与关系" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{ nodes?: any; edges?: any }>(), { nodes: () => [], edges: () => [] });
const emit = defineEmits<{ (e: 'node-click', node: any): void }>();
const zoomScale = ref(1);

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const normalizedNodes = computed(() => asArray(props.nodes).map((raw, index) => ({
  raw,
  id: String(raw.id ?? raw.nodeId ?? raw.subjectId ?? index + 1),
  label: String(raw.label ?? raw.name ?? raw.subjectName ?? raw.id ?? raw.nodeId ?? `节点 ${index + 1}`),
  type: String(raw.type ?? raw.nodeType ?? raw.subjectType ?? 'NODE')
})));

const normalizedEdges = computed(() => asArray(props.edges).map((raw, index) => ({
  key: String(raw.id ?? raw.edgeId ?? index),
  source: String(raw.source ?? raw.sourceId ?? raw.from ?? raw.fromId ?? ''),
  target: String(raw.target ?? raw.targetId ?? raw.to ?? raw.toId ?? ''),
  label: String(raw.label ?? raw.type ?? raw.relationType ?? '')
})));

const canvasWidth = computed(() => Math.max(900, normalizedNodes.value.length * 220 + 60));
const renderedNodes = computed(() => normalizedNodes.value.map((node, index) => ({
  ...node,
  x: 30 + index * 220,
  y: index % 2 === 0 ? 105 : 245,
  shortLabel: node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label,
  shortId: node.id.length > 22 ? `${node.id.slice(0, 20)}...` : node.id
})));

const renderedEdges = computed(() => normalizedEdges.value.flatMap(edge => {
  const source = renderedNodes.value.find(node => node.id === edge.source);
  const target = renderedNodes.value.find(node => node.id === edge.target);
  if (!source || !target) return [];
  return [{ ...edge, x1: source.x + 170, y1: source.y + 41, x2: target.x, y2: target.y + 41 }];
}));

const zoomIn = () => { if (zoomScale.value < 1.8) zoomScale.value += 0.2; };
const zoomOut = () => { if (zoomScale.value > 0.6) zoomScale.value -= 0.2; };
const resetZoom = () => { zoomScale.value = 1; };
</script>

<style scoped>
.graphviz-canvas-wrapper { display: flex; flex-direction: column; min-height: 520px; width: 100%; }
.canvas-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 16px; background: #fbfdfc; border-bottom: 1px solid var(--color-border); }
.toolbar-left, .tool-actions { display: flex; align-items: center; gap: 8px; }
.pulse-node { width: 7px; height: 7px; border-radius: 50%; background: var(--color-brand); }
.title { font-size: 13px; font-weight: 700; color: var(--color-ink); }
.spec-label { font-size: 11px; background: var(--color-brand-soft); color: var(--color-brand); border: 1px solid var(--color-brand-border); padding: 2px 6px; border-radius: 3px; }
.canvas-stage-wrapper { flex: 1; overflow: auto; background-color: #fafcfb; background-image: radial-gradient(#d5e2da 1px, transparent 1px); background-size: 20px 20px; }
.canvas-stage { transform-origin: left top; transition: transform 0.2s ease; }
.graph-node { cursor: pointer; }
.graph-node:hover rect:first-child { stroke-width: 2.5; }
</style>
