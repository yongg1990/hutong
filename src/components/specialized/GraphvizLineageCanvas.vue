<template>
  <div class="graphviz-canvas-wrapper">
    <div class="canvas-toolbar">
      <div class="toolbar-left">
        <span class="pulse-node"></span>
        <span class="title">全链因果图谱引擎 (DAG Lineage Graphviz Canvas)</span>
        <span class="spec-label">GB/T 31774 溯源因果闭环</span>
      </div>
      <div class="tool-actions">
        <el-button size="small" @click="zoomIn">放大 (+)</el-button>
        <el-button size="small" @click="zoomOut">缩小 (-)</el-button>
        <el-button size="small" @click="resetZoom">重置 100%</el-button>
      </div>
    </div>

    <div class="canvas-stage-wrapper">
      <div class="canvas-stage" :style="{ transform: `scale(${zoomScale})` }">
        <svg class="lineage-svg" width="100%" height="480" viewBox="0 0 1000 480">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0e5f40" />
            </marker>
            <filter id="card-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08" flood-color="#0e5f40" />
            </filter>
            <filter id="card-shadow-hover" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity="0.22" flood-color="#0e5f40" />
            </filter>
          </defs>

          <!-- Connecting Edge Paths -->
          <path d="M 145 180 L 255 180" stroke="#0e5f40" stroke-width="2" marker-end="url(#arrow)" />
          <path d="M 385 180 L 495 180" stroke="#0e5f40" stroke-width="2" marker-end="url(#arrow)" />
          <path d="M 625 180 L 735 180" stroke="#0e5f40" stroke-width="2" marker-end="url(#arrow)" />
          <path d="M 560 220 L 560 340 L 735 340" stroke="#b26a00" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4 3" />

          <!-- Nodes -->
          <!-- Node 1: Crop Batch -->
          <g class="graph-node" transform="translate(20, 140)" @click="emitNode('CROP-WS-001', '作物批次: 文山三七', 'BATCH')">
            <rect x="0" y="0" width="125" height="80" rx="8" fill="#ffffff" stroke="#0e5f40" stroke-width="1.8" />
            <rect x="0" y="0" width="125" height="6" rx="3" fill="#0e5f40" />
            <text x="62" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="#12211b" class="mono">CROP-WS-001</text>
            <text x="62" y="46" text-anchor="middle" font-size="11" fill="#4a6155">文山三七基地</text>
            <rect x="12" y="54" width="101" height="18" rx="4" fill="#edf6f1" />
            <text x="62" y="67" text-anchor="middle" font-size="9.5" font-weight="600" fill="#0e5f40">🌱 田间种植 · 已上链</text>
          </g>

          <!-- Node 2: Harvest Batch -->
          <g class="graph-node" transform="translate(260, 140)" @click="emitNode('HARVEST-2026-08', '采收批次: 采收 1200kg', 'HARVEST')">
            <rect x="0" y="0" width="125" height="80" rx="8" fill="#ffffff" stroke="#0e5f40" stroke-width="1.8" />
            <rect x="0" y="0" width="125" height="6" rx="3" fill="#0e5f40" />
            <text x="62" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="#12211b" class="mono">HARVEST-0801</text>
            <text x="62" y="46" text-anchor="middle" font-size="11" fill="#4a6155">头状根切片鲜品</text>
            <rect x="12" y="54" width="101" height="18" rx="4" fill="#edf6f1" />
            <text x="62" y="67" text-anchor="middle" font-size="9.5" font-weight="600" fill="#0e5f40">🌾 采收检验 · 已核验</text>
          </g>

          <!-- Node 3: Processed Piece Batch -->
          <g class="graph-node" transform="translate(500, 140)" @click="emitNode('PIECE-SQ-260731', '饮片批次: 三七切片', 'PROCESS')">
            <rect x="0" y="0" width="125" height="80" rx="8" fill="#ffffff" stroke="#0e5f40" stroke-width="1.8" />
            <rect x="0" y="0" width="125" height="6" rx="3" fill="#0e5f40" />
            <text x="62" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="#12211b" class="mono">SQ-260731-08</text>
            <text x="62" y="46" text-anchor="middle" font-size="11" fill="#4a6155">三七饮片 10kg/箱</text>
            <rect x="12" y="54" width="101" height="18" rx="4" fill="#edf6f1" />
            <text x="62" y="67" text-anchor="middle" font-size="9.5" font-weight="600" fill="#0e5f40">⚙️ 趁鲜质检 · 全检通过</text>
          </g>

          <!-- Node 4: Warehoused / Delivery -->
          <g class="graph-node" transform="translate(740, 140)" @click="emitNode('WH-KM-001', '仓储交割: 昆明中心仓', 'WAREHOUSE')">
            <rect x="0" y="0" width="125" height="80" rx="8" fill="#ffffff" stroke="#0e5f40" stroke-width="1.8" />
            <rect x="0" y="0" width="125" height="6" rx="3" fill="#0e5f40" />
            <text x="62" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="#12211b" class="mono">XS-202608-018</text>
            <text x="62" y="46" text-anchor="middle" font-size="11" fill="#4a6155">昆明中心仓 A-02</text>
            <rect x="12" y="54" width="101" height="18" rx="4" fill="#edf6f1" />
            <text x="62" y="67" text-anchor="middle" font-size="9.5" font-weight="600" fill="#0e5f40">📦 供销交割 · 已入库</text>
          </g>

          <!-- Node 5: Decoction Order -->
          <g class="graph-node" transform="translate(740, 300)" @click="emitNode('RX-TOKEN-8921', '代煎处方: 8691234567890123', 'DECOCTION')">
            <rect x="0" y="0" width="125" height="80" rx="8" fill="#ffffff" stroke="#b26a00" stroke-width="1.8" />
            <rect x="0" y="0" width="125" height="6" rx="3" fill="#b26a00" />
            <text x="62" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="#12211b" class="mono">RX-86912345</text>
            <text x="62" y="46" text-anchor="middle" font-size="11" fill="#4a6155">云南省中医院代煎</text>
            <rect x="12" y="54" width="101" height="18" rx="4" fill="#fff4e5" />
            <text x="62" y="67" text-anchor="middle" font-size="9.5" font-weight="600" fill="#b26a00">🍵 处方代煎 · 配送中</text>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['node-click']);

const zoomScale = ref(1.0);

const zoomIn = () => {
  if (zoomScale.value < 1.8) zoomScale.value += 0.2;
};

const zoomOut = () => {
  if (zoomScale.value > 0.6) zoomScale.value -= 0.2;
};

const resetZoom = () => {
  zoomScale.value = 1.0;
};

const emitNode = (id: string, label: string, type: string) => {
  emit('node-click', { id, label, type });
};
</script>

<style scoped>
.graphviz-canvas-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px;
  background: #fbfdfc;
  border-bottom: 1px solid var(--color-border);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-node {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-brand);
  box-shadow: 0 0 0 2px rgba(14, 95, 64, 0.2);
}

.canvas-toolbar .title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-ink);
}

.spec-label {
  font-size: 10.5px;
  background: var(--color-brand-soft);
  color: var(--color-brand);
  border: 1px solid var(--color-brand-border);
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.canvas-stage-wrapper {
  flex: 1;
  background-color: #fafcfb;
  background-image: radial-gradient(#d5e2da 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: auto;
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.canvas-stage {
  padding: 20px;
  transform-origin: center top;
  transition: transform 0.2s ease;
}

.graph-node {
  cursor: pointer;
  filter: url(#card-shadow);
  transition: filter 0.2s ease;
}

.graph-node:hover {
  filter: url(#card-shadow-hover);
}

.graph-node rect:first-of-type {
  transition: stroke-width 0.2s ease, stroke 0.2s ease;
}

.graph-node:hover rect:first-of-type {
  stroke-width: 2.2;
}
</style>
