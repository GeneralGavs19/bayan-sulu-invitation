# ⚡ Быстрая справка / Quick Reference

## 📂 Структура файлов

```
bayan-sulu/
├── client/                 # Vue.js фронтенд
│   ├── src/
│   │   ├── App.vue        # Главный компонент (форма + приглашение)
│   │   └── main.js        # Запуск приложения
│   ├── index.html         # HTML шаблон
│   ├── vite.config.js     # Конфиг Vite (dev server + proxy)
│   └── package.json
│
├── server/                # Node.js/Express бэкенд
│   ├── server.js          # API, MongoDB, Email логика
│   ├── .env               # Переменные мира (создать копию из .env.example)
│   ├── .env.example       # Пример .env
│   └── package.json
│
├── README.md              # Полная документация
├── SETUP.md              # Быстрый старт
├── SETUP_SERVICES.md     # Настройка MongoDB и Resend
├── DEPLOYMENT.md         # Развертывание на Vercel/Railway
├── install.bat           # Windows установка
├── install.sh            # Linux/Mac установка
├── package.json          # Root package.json (для concurrently)
└── .gitignore
```

## 🚀 Команды

### Установка
```bash
# Windows
install.bat

# Linux/Mac
bash install.sh

# Или вручную:
cd server && npm install
cd ../client && npm install
```

### Разработка

```bash
# Терминал 1: Бэкенд
cd server
npm run dev
# Сервер на http://localhost:3001

# Терминал 2: Фронтенд
cd client
npm run dev
# Приложение на http://localhost:5173
```

### Production (build)
```bash
# Frontend build
cd client && npm run build
# Создает папку dist/

# Backend просто copy server.js на сервер
```

## 🔑 Ключевые переменные .env

```
MONGODB_URI=...          # Connection string от Atlas
RESEND_API_KEY=...       # API ключ от Resend
EMAIL_FROM=...           # Email для отправки
FRONTEND_URL=...         # URL фронтенда (для CORS)
PORT=3001                # Порт сервера
```

## 🌐 API Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/health` | - | `{status: "OK"}` |
| POST | `/api/invitations/submit` | `{name, email, willAttend}` | `{success, id}` |
| GET | `/api/invitations/stats` | - | `{total, attending, notAttending, percentAttending}` |

## 📧 Email Flow

1. Пользователь отправляет форму
2. Данные сохраняются в MongoDB
3. Resend отправляет красивое HTML письмо
4. На странице отображается приглашение

## 🎨 Кастомизация

### Цвета
Основный фиолетовый градиент:
- Первый: `#667eea`
- Второй: `#764ba2`

Найдите в `client/src/App.vue` и измените на свои:
```js
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Текст события
В `client/src/App.vue`:
```vue
<h1>🎊 Баян Сулу 2026 🎊</h1>
```

Измените на:
```vue
<h1>🎊 Ваше событие 2026 🎊</h1>
```

### Email отправитеу
В `server/server.js` измените `EMAIL_FROM`:
```js
from: 'hello@yourdomain.com'  // вместо default
```

## 🔍 Отладка

### Проверка MongoDB
```bash
# В MongoDB Atlas Dashboard
# Collections → responses → посмотрить данные
```

### Проверка Email
```bash
# В Resend Dashboard
# Emails → посмотреть отправленные письма
```

### Версия Node.js
```bash
node --version  # Должен быть 16+
```

### Логи сервера
```bash
# В терминале где запущен npm run dev
# Ищите ошибки в консоли
```

## 🌍 Shareable URL

Сайт уже готов к sharing через ссылку!

Пример:
```
https://bayan-sulu.vercel.app/?guestName=Alisher
```

Можно добавить query параметры через URL для предзаполнения формы (если нужно).

## 📱 Мобильная версия

Полностью адаптирован! Тестируйте в Chrome DevTools (F12 → Toggle device toolbar).

## ✅ Что работает

- ✓ Красивая форма приглашения
- ✓ Отправка на MongoDB
- ✓ Email отправка с Resend
- ✓ Красивое отображение приглашения
- ✓ Скачивание как HTML
- ✓ Поделиться ссылкой
- ✓ CORS для API
- ✓ Мобильная оптимизация
- ✓ Graceful error handling

## 📊 Статистика ответов

После нескольких ответов используйте:
```bash
curl http://localhost:3001/api/invitations/stats
```

Получите:
```json
{
  "total": 10,
  "attending": 7,
  "notAttending": 3,
  "percentAttending": 70
}
```

## 🎓 Папки для редактирования

**Если хотите изменить дизайн:**
- `client/src/App.vue` - весь дизайн здесь

**Если хотите изменить логику БД:**
- `server/server.js` - подключение и endpoint'ы

**Если хотите изменить email:**
- `server/server.js` - функция `generateInvitationHTML()`

---

**Всё просто!** Начните с `SETUP.md` и следуйте инструкциям. 🚀
