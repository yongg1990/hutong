<template>
  <div class="app-layout">
    <Navbar />
    <div class="app-body">
      <Sidebar />
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <div :key="$route.fullPath" class="page-wrapper">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from './Navbar.vue';
import Sidebar from './Sidebar.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-bg);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  max-width: 100%;
  padding: 16px 20px;
  background-color: var(--color-bg);
  position: relative;
  box-sizing: border-box;
}

.page-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* Page Transition: Slide in from right (Subtle) */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(15px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
</style>
