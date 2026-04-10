<template>
  <div class="app">
    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загружаем приглашение...</p>
    </div>

    <!-- Admin Page -->
    <div v-else-if="currentPage === 'admin'" class="admin-page">
      <div class="admin-page-header">
        <h1>🌸 Панель модератора</h1>
        <button @click="goHome" class="btn-back-admin">← Назад на главную</button>
      </div>

      <!-- Admin Login Form -->
      <div v-if="!adminLoggedIn" class="admin-login-container">
        <div class="admin-login-box">
          <h2>Вход в панель модератора</h2>
          <form @submit.prevent="adminLogin" class="admin-form">
            <div class="form-group-admin">
              <label>Email</label>
              <input
                v-model="adminEmail"
                type="email"
                placeholder="Введите email"
                required
              />
            </div>
            <div class="form-group-admin">
              <label>Пароль</label>
              <input
                v-model="adminPassword"
                type="password"
                placeholder="Введите пароль"
                required
              />
            </div>
            <button type="submit" class="btn-admin-login">Вход</button>
            <div v-if="adminError" class="admin-error">{{ adminError }}</div>
          </form>
        </div>
      </div>

      <!-- Admin Panel Content -->
      <div v-else class="admin-content">
        <div class="admin-content-header">
          <div></div>
          <button @click="adminLogout" class="btn-logout">Выход</button>
        </div>
        
        <div class="admin-stats">
          <div class="stat">
            <strong>Всего:</strong> {{ adminStats.total || 0 }}
          </div>
          <div class="stat">
            <strong>Придут:</strong> <span style="color: #5a7a5a;">{{ adminStats.attending || 0 }}</span>
          </div>
          <div class="stat">
            <strong>Не придут:</strong> <span style="color: #8B5A45;">{{ adminStats.notAttending || 0 }}</span>
          </div>
        </div>

        <div class="admin-responses">
          <h3>Все ответы гостей:</h3>
          <div v-if="adminResponses.length === 0" class="no-responses">Пока нет ответов</div>
          <div v-else class="responses-list">
            <div v-for="resp in adminResponses" :key="resp._id" class="response-item">
              <div class="resp-header">
                <strong>{{ resp.name }}</strong>
                <span class="resp-email">{{ resp.email }}</span>
              </div>
              <div class="resp-status">
                <span v-if="resp.willAttend" class="status-yes">✓ Придет</span>
                <span v-else class="status-no">✗ Не придет</span>
              </div>
              <div class="resp-date">{{ formatDate(resp.createdAt) }}</div>
              <button @click="deleteResponse(resp._id)" class="btn-delete">Удалить</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Home Page -->
    <div v-else class="container">
      <!-- Background decorative elements -->
      <div class="bg-decoration bg-flowers-1"></div>
      <div class="bg-decoration bg-flowers-2"></div>
      <div class="bg-decoration bg-flowers-3"></div>

      <!-- Admin Button -->
      <button @click="goToAdmin" class="admin-toggle">👨‍💼 Админ</button>

      <!-- Step 1: Form -->
      <div v-if="!submitted" class="card form-card">
        <div class="header">
          <h1>🎊 Баян Сулу 2026 🎊</h1>
          <p class="subtitle">Приглашение на праздник / You're Invited</p>
        </div>

        <form @submit.prevent="submitForm" class="form">
          <div class="form-group">
            <label for="name">Ваше имя / Your Name</label>
            <input
              v-model="formData.name"
              type="text"
              id="name"
              placeholder="Введите имя"
              required
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              v-model="formData.email"
              type="email"
              id="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label>Вы придете? / Will you come?</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  v-model.boolean="formData.willAttend"
                  type="radio"
                  :value="true"
                />
                <span class="radio-label">🎉 Да, приду! / Yes, I will come!</span>
              </label>
              <label class="radio-option">
                <input
                  v-model.boolean="formData.willAttend"
                  type="radio"
                  :value="false"
                />
                <span class="radio-label">😢 Не приду / I won't come</span>
              </label>
            </div>
            <p class="form-hint">
              <span v-if="formData.willAttend">✓ Приглашение будет отправлено на ваш email</span>
              <span v-else>📝 Ваш ответ будет записан, письмо не отправляется</span>
            </p>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="!submitting">📤 Отправить / Send RSVP</span>
            <span v-else>Отправляем...</span>
          </button>

          <div v-if="error" class="error-message">
            ❌ {{ error }}
          </div>
        </form>
      </div>

      <!-- Step 2: Invitation Display -->
      <transition name="slide-in">
        <div v-if="submitted" class="card success-card">
          <button @click="resetForm" class="btn-back">← Назад / Back</button>
          
          <div class="invitation">
            <div class="invitation-header">
              <div class="decoration">✨ ✨ ✨ ✨ ✨</div>
              <h1>Приглашаем Вас на</h1>
              <h2 class="event-name">Баян Сулу 2026</h2>
              <p class="invitation-subtitle">Bayan Sulu 2026</p>
            </div>

            <div class="guest-name">{{ formData.name }}</div>

            <div class="invitation-content">
              <p class="invitation-text">Уважаемый(ая) гость!</p>
              <p class="invitation-text">
                С честью приглашаем Вас принять участие в праздновании нашего торжества
              </p>
              <p class="event-details">
                🎊 Праздник красоты и радости <br>
                📅 2026 год <br>
                ✨ Приготовьтесь к незабываемому вечеру!
              </p>
            </div>

            <div class="decoration">🎊 💐 🎊</div>

            <div class="invitation-footer">
              <template v-if="formData.willAttend">
                <p class="attending-response">✓ ВЫ ПОДТВЕРДИЛИ СВОЕ УЧАСТИЕ</p>
                <p>Приглашение отправлено на {{ formData.email }}</p>
                <p>Waiting for you! 🎉</p>
              </template>
              <template v-else>
                <p class="not-attending-response">✗ ВЫ СООБЩИЛИ О НЕВОЗМОЖНОСТИ ПРИЕХАТЬ</p>
                <p style="color: #B399A3; font-style: italic;">Ваш ответ принят (письмо не отправляется)</p>
                <p style="color: #B399A3; font-style: italic;">Your response has been recorded</p>
              </template>
            </div>
          </div>

          <div class="actions">
            <button @click="downloadInvitationPNG" class="btn btn-secondary">
              🖼️ Скачать как картинку
            </button>
            <button @click="downloadInvitation" class="btn btn-secondary">
              📥 Скачать HTML
            </button>
            <button @click="shareLink" class="btn btn-secondary">
              📤 Поделиться ссылкой
            </button>
            <button @click="resetForm" class="btn btn-primary">
              ✚ Отправить еще
            </button>
          </div>

          <div v-if="shareSuccess" class="success-message">
            ✓ Ссылка скопирована в буфер обмена!
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const API_URL = '';

export default {
  name: 'App',
  data() {
    return {
      currentPage: 'home', // 'home' or 'admin'
      formData: {
        name: '',
        email: '',
        willAttend: true
      },
      submitted: false,
      submitting: false,
      loading: true,
      error: '',
      shareSuccess: false,
      apiUrl: API_URL,
      // Admin related
      adminLoggedIn: false,
      adminEmail: '',
      adminPassword: '',
      adminError: '',
      adminResponses: [],
      adminStats: {
        total: 0,
        attending: 0,
        notAttending: 0
      }
    };
  },
  mounted() {
    // Check server health
    axios
      .get(`${this.apiUrl}/health`)
      .then(() => {
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.error = 'Не удалось подключиться к серверу';
      });

    // Check if already logged in (from localStorage)
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      this.adminLoggedIn = true;
    }
  },
  watch: {
    currentPage(newVal) {
      if (newVal === 'admin' && this.adminLoggedIn) {
        this.loadAdminData();
      }
    }
  },
  methods: {
    // Navigation
    goToAdmin() {
      this.currentPage = 'admin';
    },

    goHome() {
      this.resetForm();
      this.adminLogout();
      this.currentPage = 'home';
    },

    // Admin login
    async adminLogin() {
      this.adminError = '';
      try {
        const response = await axios.post(`${this.apiUrl}/admin/login`, {
          email: this.adminEmail,
          password: this.adminPassword
        });

        if (response.data.success) {
          this.adminLoggedIn = true;
          localStorage.setItem('adminToken', response.data.token);
          this.adminEmail = '';
          this.adminPassword = '';
          this.loadAdminData();
        }
      } catch (error) {
        this.adminError = error.response?.data?.error || 'Ошибка входа';
        console.error('Login error:', error);
      }
    },

    // Admin logout
    adminLogout() {
      this.adminLoggedIn = false;
      this.adminEmail = '';
      this.adminPassword = '';
      this.adminResponses = [];
      localStorage.removeItem('adminToken');
    },
    async submitForm() {
      if (!this.formData.name.trim()) {
        this.error = 'Пожалуйста, введите имя';
        return;
      }

      this.submitting = true;
      this.error = '';

      try {
        const response = await axios.post(`${this.apiUrl}/invitations/submit`, {
          name: this.formData.name,
          email: this.formData.email,
          willAttend: this.formData.willAttend,
          eventKey: 'bayanSulu2026'
        });

        if (response.data.success) {
          this.submitted = true;
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка отправки приглашения';
        console.error('Submit error:', error);
      } finally {
        this.submitting = false;
      }
    },

    resetForm() {
      this.submitted = false;
      this.formData = {
        name: '',
        email: '',
        willAttend: true
      };
      this.error = '';
      this.shareSuccess = false;
      window.scrollTo(0, 0);
    },

    downloadInvitation() {
      const element = document.createElement('a');
      const file = new Blob([this.getInvitationHTML()], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = `invitation-${this.formData.name.replace(/\\s+/g, '_')}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },

    async downloadInvitationPNG() {
      try {
        const response = await axios.post(
          `${this.apiUrl}/invitations/generate-image`,
          {
            name: this.formData.name,
            willAttend: this.formData.willAttend
          },
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invitation-${this.formData.name.replace(/\\s+/g, '_')}.png`);
        document.body.appendChild(link);
        link.click();
        link.parentChild.removeChild(link);
      } catch (error) {
        this.error = 'Ошибка скачивания картинки: ' + error.message;
        console.error('Download PNG error:', error);
      }
    },

    shareLink() {
      const currentUrl = window.location.href;
      navigator.clipboard.writeText(currentUrl).then(() => {
        this.shareSuccess = true;
        setTimeout(() => {
          this.shareSuccess = false;
        }, 3000);
      });
    },

    async loadAdminData() {
      try {
        const [respResponse, statsResponse] = await Promise.all([
          axios.get(`${this.apiUrl}/admin/responses`),
          axios.get(`${this.apiUrl}/invitations/stats`)
        ]);

        this.adminResponses = respResponse.data.responses;
        this.adminStats = statsResponse.data;
      } catch (error) {
        console.error('Admin load error:', error);
        this.error = 'Ошибка загрузки админ панели';
      }
    },

    async deleteResponse(id) {
      if (!confirm('Вы уверены? Удаленные данные не восстановятся.')) {
        return;
      }

      try {
        await axios.delete(`${this.apiUrl}/admin/responses/${id}`);
        await this.loadAdminData();
      } catch (error) {
        console.error('Delete error:', error);
        this.error = 'Ошибка удаления';
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    getInvitationHTML() {
      const footerContent = this.formData.willAttend
        ? `<p class="status-text">✓ ВЫ ПОДТВЕРДИЛИ СВОЕ УЧАСТИЕ</p>
           <p>Спасибо за ответ!<br>Приглашение отправлено на ${this.formData.email}</p>`
        : `<p class="status-text not-attending">✗ ВЫ СООБЩИЛИ О НЕВОЗМОЖНОСТИ ПРИЕХАТЬ</p>
           <p>Ваш ответ принят (письмо не отправляется)<br>Your response has been recorded</p>`;

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { margin: 0; padding: 20px; font-family: 'Georgia', serif; background: linear-gradient(135deg, #F0E6D2 0%, #E8D5C4 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .invitation { background: #FFFAF0; border-radius: 20px; padding: 50px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); text-align: center; border: 3px solid #D4A5A5; }
            .header { margin-bottom: 30px; }
            .event-title { color: #8B7355; font-size: 28px; margin: 10px 0; font-weight: normal; letter-spacing: 2px; }
            .event-name { color: #D4A5A5; font-size: 42px; margin: 5px 0 15px 0; font-weight: normal; letter-spacing: 3px; }
            .subtitle { color: #B399A3; font-size: 16px; margin: 0 0 30px 0; font-style: italic; }
            .name { color: #5a4a4a; font-size: 32px; font-weight: bold; margin: 30px 0; padding: 20px; background: #F5E6E0; border-radius: 10px; border-left: 5px solid #D4A5A5; }
            .content { margin: 30px 0; line-height: 1.8; color: #8B7355; }
            .content-text { font-size: 16px; margin: 15px 0; }
            .details { background: #F5E6E0; padding: 20px; border-radius: 10px; margin: 20px 0; color: #8B7355; }
            .decorative { font-size: 24px; margin: 20px 0; letter-spacing: 8px; color: #D4A5A5; }
            .footer { margin-top: 30px; border-top: 2px dashed #E8D5C4; padding-top: 20px; }
            .status-text { font-weight: bold; font-size: 16px; color: #5a7a5a; margin: 10px 0; }
            .status-text.not-attending { color: #8B5A45; }
            .footer p { color: #8B7355; font-size: 14px; line-height: 1.6; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="invitation">
            <div class="decorative">✨ ✨ ✨ ✨ ✨</div>
            <div class="header">
              <p class="event-title">Приглашаем Вас на</p>
              <h1 class="event-name">Баян Сулу 2026</h1>
              <p class="subtitle">Bayan Sulu 2026</p>
            </div>
            <div class="name">${this.formData.name}</div>
            <div class="content">
              <p class="content-text">Уважаемый(ая) гость!</p>
              <p class="content-text">С честью приглашаем Вас принять участие в праздновании нашего торжества</p>
              <div class="details">
                <p>🎊 Праздник красоты и радости</p>
                <p>📅 15 апреля 2026 года</p>
                <p>📍 <a href="https://2gis.kz/astana/geo/70000001068734198" style="color: #8B7355; text-decoration: underline;">Место проведения</a></p>
                <p>✨ Приготовьтесь к незабываемому вечеру!</p>
              </div>
            </div>
            <div class="decorative">🎊 💐 🎊</div>
            <div class="footer">
              ${footerContent}
            </div>
          </div>
        </body>
        </html>
      `;
    }
  }
};
</script>

<style scoped>
.app {
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.app::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 15% 18%, rgba(212, 165, 165, 0.18) 0%, transparent 24%),
    radial-gradient(circle at 80% 15%, rgba(179, 153, 163, 0.16) 0%, transparent 20%),
    radial-gradient(circle at 25% 80%, rgba(180, 231, 209, 0.14) 0%, transparent 28%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3E%3Ccircle cx='180' cy='180' r='124' fill='%23F4D4C8' opacity='0.55'/%3E%3Ccircle cx='620' cy='150' r='94' fill='%23B399A3' opacity='0.45'/%3E%3Cpath d='M215 190c18-36 64-36 82 0s-18 46-34 64-62 18-82-8 18-42 34-56z' fill='%23D4A5A5' opacity='0.55'/%3E%3Cpath d='M580 130c16-26 42-26 58 0s-16 32-28 46-48 14-64-6 16-38 34-40z' fill='%23B399A3' opacity='0.55'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: cover;
  opacity: 0.8;
}

body {
  background: linear-gradient(135deg, #F0E6D2 0%, #E8D5C4 100%) !important;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  text-align: center;
  color: #8B7355;
  background: white;
  flex-direction: column;
}

.spinner {
  border: 4px solid rgba(139, 115, 85, 0.2);
  border-radius: 50%;
  border-top: 4px solid #8B7355;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Background Decorative Elements */
.bg-decoration {
  position: absolute;
  z-index: -1;
  opacity: 0.18;
}

.bg-flowers-1 {
  top: 10%;
  left: 5%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #D4A5A5 2px, transparent 2px);
  background-size: 20px 20px;
}

.bg-flowers-2 {
  top: 50%;
  right: 5%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #B399A3 2px, transparent 2px);
  background-size: 15px 15px;
}

.bg-flowers-3 {
  bottom: 10%;
  left: 20%;
  width: 280px;
  height: 280px;
  background: repeating-linear-gradient(
    45deg,
    #D4A5A5,
    #D4A5A5 10px,
    transparent 10px,
    transparent 20px
  );
}

/* Admin Page Styles */
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #F0E6D2 0%, #E8D5C4 100%);
  padding: 40px 20px;
  position: relative;
  z-index: 2;
}

.admin-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto 40px;
  padding-bottom: 20px;
  border-bottom: 3px solid #D4A5A5;
}

.admin-page-header h1 {
  color: #8B7355;
  font-size: 32px;
  margin: 0;
  font-weight: normal;
  letter-spacing: 2px;
}

.btn-back-admin {
  background: linear-gradient(135deg, #D4A5A5 0%, #B399A3 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-back-admin:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 165, 165, 0.3);
}

.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.admin-login-box {
  background: white;
  border-radius: 20px;
  padding: 50px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 2px solid #D4A5A5;
  max-width: 400px;
  width: 100%;
}

.admin-login-box h2 {
  color: #8B7355;
  margin: 0 0 30px 0;
  text-align: center;
  font-size: 24px;
  font-weight: normal;
}

.admin-login-box .form-group-admin {
  margin-bottom: 20px;
}

.admin-login-box .form-group-admin label {
  color: #8B7355;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
  font-size: 14px;
}

.admin-login-box .form-group-admin input {
  width: 100%;
  padding: 12px;
  border: 2px solid #E8D5C4;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.admin-login-box .form-group-admin input:focus {
  outline: none;
  border-color: #D4A5A5;
  background: #FFFAF0;
}

.admin-content {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.admin-content-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #E8D5C4;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat {
  padding: 15px;
  background: #F5E6E0;
  border-radius: 10px;
  color: #8B7355;
  font-size: 14px;
  border-left: 3px solid #D4A5A5;
}

.admin-responses {
  margin-top: 30px;
}

.admin-responses h3 {
  color: #8B7355;
  font-size: 18px;
  margin: 0 0 20px 0;
  font-weight: normal;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.response-item {
  padding: 15px;
  background: #FFFAF0;
  border: 1px solid #E8D5C4;
  border-radius: 8px;
  font-size: 13px;
}

.resp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.resp-header strong {
  color: #5a4a4a;
}

.resp-email {
  color: #B399A3;
  font-size: 12px;
}

.resp-status {
  margin: 5px 0;
}

.status-yes {
  color: #5a7a5a;
  font-weight: 600;
}

.status-no {
  color: #8B5A45;
  font-weight: 600;
}

.resp-date {
  color: #A89898;
  font-size: 11px;
  margin: 8px 0;
}

.btn-delete {
  width: 100%;
  background: #F4D4C8;
  color: #8B5A45;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #E8B4A8;
}

.no-responses {
  text-align: center;
  color: #A89898;
  padding: 40px;
  font-style: italic;
}

/* Home Page Container */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  z-index: 1;
}

/* Admin Toggle Button */
.admin-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #D4A5A5 0%, #B399A3 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  z-index: 100;
  transition: all 0.3s;
}

.admin-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 165, 165, 0.3);
}

/* Card Styles */
.card {
  width: 100%;
  max-width: 700px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-in;
  border: 2px solid #E8D5C4;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-card .header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #8B7355;
  font-size: 36px;
  margin: 0 0 10px;
  font-family: 'Georgia', serif;
  font-weight: normal;
  letter-spacing: 2px;
}

.subtitle {
  color: #B399A3;
  font-size: 16px;
  margin: 0;
  font-style: italic;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  color: #8B7355;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group input[type='text'],
.form-group input[type='email'] {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #E8D5C4;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
  font-family: 'Georgia', serif;
  box-sizing: border-box;
}

.form-group input[type='text']:focus,
.form-group input[type='email']:focus {
  outline: none;
  border-color: #D4A5A5;
  background: #FFFAF0;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border: 2px solid #E8D5C4;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #FFFAF0;
}

.radio-option:hover {
  border-color: #D4A5A5;
  background: #F5E6E0;
}

.radio-option input[type='radio'] {
  margin-right: 12px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #D4A5A5;
}

.radio-label {
  font-size: 16px;
  color: #8B7355;
  cursor: pointer;
  font-family: 'Georgia', serif;
}

.form-hint {
  margin-top: 8px;
  padding: 10px;
  background: #F5E6E0;
  border-left: 3px solid #D4A5A5;
  color: #8B7355;
  font-size: 13px;
  border-radius: 4px;
}

.btn {
  width: 100%;
  padding: 14px 22px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
  font-family: 'Georgia', serif;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
}

.btn:active {
  transform: scale(0.98);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #D4A5A5 0%, #B399A3 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(212, 165, 165, 0.45);
}

.btn-primary:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #8B7355;
  border: 2px solid #D4A5A5;
}

.btn-secondary:hover {
  background: #F5E6E0;
  transform: translateY(-2px);
}

.btn-secondary:active {
  background: #E8D5C4;
  transform: scale(0.98);
}

.btn-admin-login {
  background: linear-gradient(135deg, #B399A3 0%, #D4A5A5 100%);
  color: white;
  border: none;
  padding: 14px 22px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  -webkit-tap-highlight-color: transparent;
}

.btn-admin-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(212, 165, 165, 0.45);
}

.btn-admin-login:active {
  transform: scale(0.98);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.btn-back {
  background: none;
  border: none;
  color: #D4A5A5;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 20px;
  padding: 0;
  font-weight: 600;
}

.btn-logout {
  background: #F4D4C8;
  color: #8B5A45;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #E8B4A8;
}

.error-message {
  color: #8B5A45;
  padding: 12px;
  background: #F4D4C8;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
}

.admin-error {
  color: #8B5A45;
  background: #F4D4C8;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  text-align: center;
  margin-top: 15px;
}

.success-message {
  color: #5a7a5a;
  padding: 12px;
  background: #B4E7D1;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
}

/* Invitation Styles */
.invitation {
  background: #FFFAF0;
  border: 3px solid #D4A5A5;
  border-radius: 20px;
  padding: 50px 30px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.decoration {
  font-size: 24px;
  margin: 20px 0;
  letter-spacing: 8px;
  color: #D4A5A5;
}

.invitation-header h1 {
  color: #8B7355;
  font-size: 28px;
  margin: 10px 0;
  font-family: 'Georgia', serif;
  font-weight: normal;
  letter-spacing: 2px;
}

.event-name {
  color: #D4A5A5;
  font-size: 42px;
  margin: 5px 0 15px 0;
  font-weight: normal;
  letter-spacing: 3px;
}

.invitation-subtitle {
  color: #B399A3;
  font-size: 16px;
  margin: 0;
  font-style: italic;
}

.guest-name {
  color: #5a4a4a;
  font-size: 32px;
  font-weight: bold;
  margin: 30px 0;
  padding: 20px;
  background: #F5E6E0;
  border-left: 5px solid #D4A5A5;
  border-radius: 8px;
  font-family: 'Georgia', serif;
}

.invitation-content {
  margin: 30px 0;
  color: #8B7355;
  line-height: 1.8;
}

.invitation-text {
  font-size: 16px;
  margin: 12px 0;
}

.event-details {
  background: #F5E6E0;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
  color: #8B7355;
  font-size: 15px;
}

.invitation-footer {
  color: #8B7355;
  font-size: 14px;
  margin-top: 30px;
  border-top: 2px dashed #E8D5C4;
  padding-top: 20px;
  line-height: 1.6;
  font-family: 'Georgia', serif;
}

.invitation-footer p {
  margin: 8px 0;
}

.attending-response {
  font-weight: bold;
  color: #5a7a5a;
  font-size: 16px;
  margin: 10px 0;
}

.not-attending-response {
  font-weight: bold;
  color: #8B5A45;
  font-size: 16px;
  margin: 10px 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 30px;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.5s ease;
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive styles for mobile devices */
@media (max-width: 768px) {
  .container {
    padding: 10px;
    max-width: 100%;
  }
  
  .title {
    font-size: 2rem;
    letter-spacing: 2px;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .form-container,
  .success-container,
  .admin-container {
    padding: 20px;
    margin: 10px 0;
  }
  
  .form-group label {
    font-size: 0.9rem;
  }
  
  .form-group input[type="text"],
  .form-group input[type="email"] {
    padding: 12px;
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .radio-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .radio-label {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
  
  .submit-button,
  .download-button,
  .share-button {
    padding: 14px 24px;
    font-size: 0.95rem;
  }
  
  .invitation-preview {
    padding: 20px;
  }
  
  .invitation-title {
    font-size: 1.5rem;
  }
  
  .invitation-name {
    font-size: 1.3rem;
  }
  
  .decorative {
    font-size: 1.2rem;
  }
  
  .admin-title {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .response-card {
    padding: 15px;
  }
  
  .response-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .back-link {
    font-size: 0.9rem;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  body {
    padding: 10px;
  }
  
  .title {
    font-size: 1.6rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .form-container,
  .success-container,
  .admin-container {
    padding: 15px;
    border-radius: 15px;
  }
  
  .form-title,
  .success-title,
  .admin-title {
    font-size: 1.3rem;
  }
  
  .invitation-preview {
    padding: 15px;
    border-radius: 15px;
  }
  
  .invitation-title {
    font-size: 1.3rem;
  }
  
  .invitation-name {
    font-size: 1.2rem;
    padding: 15px;
  }
  
  .decorative {
    font-size: 1rem;
    letter-spacing: 4px;
  }
}
</style>
