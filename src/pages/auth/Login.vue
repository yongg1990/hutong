<template>
  <div class="tcm-login">
    <div class="tcm-scenery" aria-hidden="true"></div>
    <div class="tcm-shade" aria-hidden="true"></div>

    <header class="tcm-header">
      <div class="tcm-brand">
        <div class="tcm-emblem"><el-icon><FirstAidKit /></el-icon></div>
        <div>
          <span class="tcm-brand-name">云南中药 · 数字追溯</span>
          <span class="tcm-brand-en">YUNNAN TCM TRACEABILITY</span>
        </div>
      </div>
      <span class="tcm-header-note"><el-icon><Lock /></el-icon> 统一身份认证</span>
    </header>

    <main class="tcm-content">
      <section class="tcm-intro">
        <div class="tcm-eyebrow"><span></span> 源于自然 · 信于数字</div>
        <h1>中药全产业链<br />追溯协同平台</h1>
        <p class="tcm-description">从一株本草，到一份安心。<br />连接产地与产业，让每一程都有迹可循。</p>
        <div class="tcm-capabilities">
          <span><el-icon><Connection /></el-icon> 全程追溯</span>
          <span><el-icon><CircleCheck /></el-icon> 可信存证</span>
          <span><el-icon><Share /></el-icon> 跨域协同</span>
        </div>
      </section>

      <section class="tcm-auth" aria-labelledby="login-heading">
        <div class="tcm-form-header">
          <span class="tcm-form-eyebrow">WELCOME BACK</span>
          <h2 id="login-heading">欢迎登录</h2>
          <p>请输入您的账号信息，安全访问工作空间</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="tcm-form" size="large" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <label for="login-username" class="tcm-label">登录账号</label>
            <el-input
              v-model="form.username"
              id="login-username"
              autocomplete="username"
              placeholder="请输入管理员或业务员账号"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <label for="login-password" class="tcm-label">安全密码</label>
            <el-input
              v-model="form.password"
              id="login-password"
              autocomplete="current-password"
              type="password"
              placeholder="请输入登录密码"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item prop="captcha">
            <label for="login-captcha" class="tcm-label">验证码</label>
            <div class="tcm-captcha-row">
              <el-input
                v-model="form.captcha"
                id="login-captcha"
                placeholder="请输入计算结果"
                inputmode="numeric"
                autocomplete="off"
                :disabled="loading"
                @keyup.enter="handleLogin"
              />
              <el-tooltip content="刷新验证码" placement="top">
                <button
                  type="button"
                  class="tcm-captcha-question"
                  :disabled="loading"
                  aria-label="刷新验证码"
                  @click="refreshCaptcha"
                >{{ captcha.question }} = ?</button>
              </el-tooltip>
            </div>
          </el-form-item>

          <div class="tcm-options">
            <el-checkbox v-model="rememberMe">记住登录状态</el-checkbox>
            <el-link type="primary" :underline="false" @click="tipForget">忘记密码?</el-link>
          </div>

          <el-button
            type="primary"
            class="tcm-submit"
            :loading="loading"
            @click="handleLogin"
          >
            <span>登录平台</span><el-icon v-if="!loading"><Right /></el-icon>
          </el-button>
        </el-form>
        <div class="tcm-secure-note"><el-icon><Lock /></el-icon> 账号安全保护 · 授权访问</div>
      </section>
    </main>

    <footer class="tcm-footer">
      <span>中药全产业链追溯协同平台</span>
      <span>本草有源 · 品质可溯</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, FirstAidKit, Connection, CircleCheck, Share, Right } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/authStore';
import { apiErrorMessage } from '@/api/client';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const rememberMe = ref(true);
const formRef = ref<FormInstance>();

const form = ref({
  username: '',
  password: '',
  captcha: ''
});

const createCaptcha = () => {
  const first = Math.floor(Math.random() * 9) + 1;
  const second = Math.floor(Math.random() * 9) + 1;
  switch (Math.floor(Math.random() * 4)) {
    case 0:
      return { question: `${first} + ${second}`, answer: first + second };
    case 1:
      return { question: `${Math.max(first, second)} - ${Math.min(first, second)}`, answer: Math.abs(first - second) };
    case 2:
      return { question: `${first} * ${second}`, answer: first * second };
    default:
      return { question: `${first * second} ÷ ${second}`, answer: first };
  }
};

const captcha = ref(createCaptcha());

const refreshCaptcha = () => {
  captcha.value = createCaptcha();
  form.value.captcha = '';
  formRef.value?.clearValidate('captcha');
};

const rules: FormRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入安全密码', trigger: 'blur' }],
  captcha: [
    { required: true, whitespace: true, message: '请输入验证码计算结果', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const answer = String(value ?? '').trim();
        if (!/^\d+$/.test(answer) || Number(answer) !== captcha.value.answer) {
          callback(new Error('验证码计算结果不正确'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
};

const handleLogin = async () => {
  if (!formRef.value || loading.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await authStore.login({
        username: form.value.username,
        password: form.value.password
      });

      ElMessage.success(`欢迎回来，${res.user.realName || res.user.username}！`);

      const redirect = (route.query.redirect as string) || '/workspace';
      router.push(redirect);
    } catch (err: any) {
      ElMessage.error(apiErrorMessage(err, '登录失败，请核对账号密码'));
      refreshCaptcha();
    } finally {
      loading.value = false;
    }
  });
};

const tipForget = () => {
  ElMessageBox.alert(
    '请联系所属租户管理员或平台运维人员处理账号密码。',
    '忘记密码说明',
    { dangerouslyUseHTMLString: true }
  );
};
</script>

<style scoped>
.tcm-login {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  color: #fff;
  background: #173f32;
}

.tcm-scenery, .tcm-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.tcm-scenery {
  background: url('../../../assets/login-forest.png') center 48% / cover no-repeat;
  animation: forest-breathe 26s ease-in-out infinite alternate;
}

.tcm-shade {
  background: linear-gradient(90deg, rgba(9, 34, 26, 0.5), rgba(9, 34, 26, 0.22) 62%, rgba(9, 34, 26, 0.12));
}

.tcm-header, .tcm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 34px 64px;
}

.tcm-brand { display: flex; align-items: center; gap: 13px; min-width: 0; }
.tcm-emblem {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 27px;
}
.tcm-brand-name { display: block; font-size: 19px; font-weight: 600; }
.tcm-brand-en { display: block; margin-top: 3px; color: #d4e4dd; font-size: 10px; }
.tcm-header-note { display: flex; align-items: center; gap: 7px; color: #e0ebe6; font-size: 12px; white-space: nowrap; }

.tcm-content {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  align-items: center;
  gap: 72px;
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 36px 4px 48px;
}
.tcm-intro { min-width: 0; padding-bottom: 24px; animation: content-arrive 0.8s ease-out both; }
.tcm-eyebrow { display: flex; align-items: center; gap: 12px; color: #e2eee6; font-size: 13px; }
.tcm-eyebrow span { width: 28px; height: 2px; background: #c9dcb3; }
.tcm-intro h1 {
  margin: 24px 0;
  color: #fff;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 48px;
  font-weight: 600;
  line-height: 1.5;
  text-shadow: 0 2px 24px rgba(9, 34, 26, 0.15);
}
.tcm-description { margin: 0; color: #e0eae3; font-size: 15px; line-height: 2; }
.tcm-capabilities { display: flex; flex-wrap: wrap; gap: 16px 24px; margin-top: 44px; }
.tcm-capabilities span { display: inline-flex; align-items: center; gap: 8px; color: #eaf1e9; font-size: 13px; }
.tcm-capabilities .el-icon { color: #d4e4b8; font-size: 18px; }

.tcm-auth {
  min-width: 0;
  padding: 38px 36px 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 72px rgba(6, 29, 21, 0.18);
  color: var(--color-ink);
  animation: content-arrive 0.8s 0.12s ease-out both;
}
.tcm-form-eyebrow { color: #72817b; font-size: 10px; font-weight: 600; }
.tcm-form-header h2 { margin: 7px 0 8px; color: #243c32; font-size: 27px; font-weight: 600; line-height: 1.5; }
.tcm-form-header p { margin: 0 0 28px; color: #7b8580; font-size: 12px; line-height: 1.7; }
.tcm-form :deep(.el-form-item) { margin-bottom: 23px; }
.tcm-form :deep(.el-form-item__content) { display: block; line-height: normal; }
.tcm-label { display: block; margin-bottom: 9px; color: #3e4944; font-size: 13px; font-weight: 500; }
.tcm-form :deep(.el-input__wrapper) { min-height: 46px; padding: 0 13px; background: #fafcfb !important; }
.tcm-form :deep(.el-input__inner) { height: 44px; font-size: 13px; }
.tcm-form :deep(.el-input__prefix) { margin-right: 5px; color: #85958c; }
.tcm-captcha-row { display: flex; align-items: center; gap: 10px; width: 100%; }
.tcm-captcha-row .el-input { flex: 1; min-width: 0; }
.tcm-captcha-question {
  flex: 0 0 128px;
  white-space: nowrap;
  height: 46px;
  padding: 0 8px;
  border: 1px solid #d9e2eb;
  border-radius: 6px;
  background: repeating-linear-gradient(-45deg, #f0f5fc, #f0f5fc 4px, #e8eff9 4px, #e8eff9 5px);
  color: #3260a3;
  font: 600 17px Consolas, monospace;
  cursor: pointer;
  transition: border-color 0.2s;
}
.tcm-captcha-question:hover { border-color: #86a9dc; }
.tcm-captcha-question:disabled { cursor: not-allowed; opacity: 0.6; }
.tcm-options { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: -3px 0 21px; }
.tcm-options :deep(.el-checkbox__label), .tcm-options :deep(.el-link) { font-size: 12px; }
.tcm-options :deep(.el-checkbox__label) { padding-left: 7px; }
.tcm-submit { width: 100%; height: 46px; font-size: 14px; }
.tcm-submit :deep(> span) { display: flex; align-items: center; justify-content: center; gap: 15px; }
.tcm-submit:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(37, 99, 235, 0.18); }
.tcm-secure-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 24px; padding-top: 18px; border-top: 1px solid #edf0ee; color: #929b96; font-size: 11px; }
.tcm-secure-note .el-icon { color: #769385; font-size: 13px; }
.tcm-footer { padding-top: 20px; padding-bottom: 24px; color: #d3dfd6; font-size: 11px; }

@keyframes forest-breathe {
  from { transform: scale(1); }
  to { transform: scale(1.055); }
}
@keyframes content-arrive {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 1100px) {
  .tcm-header, .tcm-footer { padding-right: 36px; padding-left: 36px; }
  .tcm-content { grid-template-columns: minmax(0, 1fr) 390px; gap: 36px; padding-right: 36px; padding-left: 36px; }
  .tcm-intro h1 { font-size: 38px; }
  .tcm-auth { padding-right: 30px; padding-left: 30px; }
}
@media (max-width: 800px) {
  .tcm-header { padding: 24px; }
  .tcm-header-note { display: none; }
  .tcm-content { width: 100%; grid-template-columns: minmax(0, 440px); justify-content: center; gap: 24px; padding: 24px 24px 32px; }
  .tcm-intro { padding: 0; }
  .tcm-eyebrow, .tcm-description, .tcm-capabilities { display: none; }
  .tcm-intro h1 { margin: 0; font-size: 30px; line-height: 1.5; }
  .tcm-intro h1 br { display: none; }
  .tcm-footer { padding: 16px 24px 22px; font-size: 10px; }
}
@media (max-width: 420px) {
  .tcm-brand-name { font-size: 17px; }
  .tcm-brand-en { font-size: 9px; }
  .tcm-content { padding-right: 18px; padding-left: 18px; }
  .tcm-intro h1 { font-size: 25px; }
  .tcm-auth { padding: 28px 22px 22px; }
  .tcm-footer { justify-content: center; }
  .tcm-footer span:last-child { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .tcm-scenery, .tcm-intro, .tcm-auth { animation: none; }
  .tcm-submit:hover { transform: none; }
}
</style>
