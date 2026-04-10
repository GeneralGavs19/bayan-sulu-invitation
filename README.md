# Баян Сулу - Сайт приглашений
## Bayan Sulu - Invitation Website

Полнофункциональный веб-сайт для отправки красиво оформленных приглашений на праздник Баян Сулу с отправкой на электронную почту, регистрацией ответов и красивым отображением приглашения.

---

## 🚀 Особенности / Features

✅ Красивая форма приглашения на Vue.js  
✅ Регистрация ответов в MongoDB  
✅ Автоматическая отправка приглашений по email (Resend)  
✅ Скачивание приглашения как HTML файл  
✅ Поделиться ссылкой на приглашение  
✅ Статистика ответов (кто придет/не придет)  
✅ Мобильная оптимизация  
✅ Легкое развертывание на Vercel  

---

## 📋 Требования / Requirements

- Node.js 16+
- npm или yarn  
- MongoDB Atlas аккаунт (бесплатный)
- Resend API ключ (для email)

---

## 🛠️ Установка и запуск / Setup & Run

### 1. Подготовка MongoDB

Перейдите на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) и:
1. Создайте бесплатный аккаунт
2. Создайте кластер  
3. Включите доступ с любого IP (0.0.0.0/0)
4. Создайте пользователя базы данных
5. Скопируйте connection string

### 2. Получите Resend API ключ

Перейдите на [Resend.com](https://resend.com) и:
1. Создайте аккаунт
2. Подтвердите ваш домен
3. Скопируйте API ключ

### 3. Установка Backend

```bash
cd server
npm install
```

Создайте файл `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invitation_db
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
PORT=3001
```

Запустите сервер:
```bash
npm run dev  # для разработки
npm start    # для продакшена
```

Сервер запустится на `http://localhost:3001`

### 4. Установка Frontend

```bash
cd ../client
npm install
npm run dev
```

Frontend откроется на `http://localhost:5173`

---

## 📝 Использование / Usage

1. Откройте `http://localhost:5173` в браузере
2. Заполните форму (имя и email)
3. Выберите "Приду" или "Не приду"
4. Нажмите "Отправить"
5. Приглашение будет:
   - Отправлено на email
   - Отображено на экране
   - Можно скачать как HTML
   - Можно поделиться ссылкой

---

## 📦 Развертывание на Vercel / Vercel Deployment

### Frontend (Vercel)

```bash
cd client
vercel
```

Выберите проект и следуйте инструкциям.

### Backend (Vercel)

1. Переместите `server` в корень или создайте новый проект
2. Добавьте переменные окружения в Vercel dashboard
3. Развертните

Альтернатива: используйте services вроде Railway, Render или Heroku для backend.

---

## 🔐 Переменные окружения / Environment Variables

**Backend (.env)**
```env
MONGODB_URI=your_mongodb_connection_string
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001
```

**Frontend (vite.config.js proxy)**
```js
proxy: {
  '/api': {
    target: 'https://your-backend-url.com',
    changeOrigin: true
  }
}
```

---

## 📊 API Endpoints

### POST `/api/invitations/submit`
Отправляет ответ гостя
```json
{
  "name": "Алишер",
  "email": "user@example.com",
  "willAttend": true,
  "eventKey": "bayanSulu2026"
}
```

### GET `/api/invitations/stats`
Получает статистику ответов
```json
{
  "total": 50,
  "attending": 35,
  "notAttending": 15,
  "percentAttending": 70
}
```

---

## 📱 Мобильная оптимизация

Сайт полностью адаптирован для мобильных устройств. Все элементы корректно отображаются на экранах от 320px.

---

## 🎨 Кастомизация

Вы можете изменить:
- **Цвета**: Измените переменные в `App.vue` (градиент #667eea - #764ba2)
- **Текст**: Отредактируйте строки на английском/русском
- **Фон**: Измените `background` в `index.html`
- **Дизайн приглашения**: Отредактируйте HTML в методе `generateInvitationHTML()`

---

## 🐛 Troubleshooting

**Ошибка подключения к MongoDB**
- Проверьте connection string
- Убедитесь, что IP-адрес в whitelist MongoDB Atlas
- Проверьте правильность пароля

**Email не отправляется**
- Проверьте API ключ Resend
- Убедитесь, что домен подтвержден в Resend
- Проверьте консоль сервера на ошибки

**CORS ошибки**
- Убедитесь, что `FRONTEND_URL` правильный в `.env`
- Проверьте proxy в `vite.config.js`

---

## 📄 Лайсенс / License

MIT License - используйте свободно!

---

## 👨‍💻 Автор / Author

Создано для праздника Баян Сулу 2026

Любых вопросов - спрашивайте! 🎉
