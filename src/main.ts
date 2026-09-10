import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/authStore';
import './style.css';

const app = createApp(App);

app.config.errorHandler = (err: any, _instance, info) => {
  const errMsg = err instanceof Error ? (err.stack || err.message) : String(err);
  console.error(`[Vue Error Handler]: ${errMsg} (info: ${info})`);
};

const pinia = createPinia();
app.use(pinia);

// Restore active authentication session
useAuthStore().initSession();

app.use(router);
app.use(ElementPlus, {
  locale: zhCn
});

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
