# 📱 Развертывание на Vercel и других платформах

## ✨ Самый быстрый способ - Vercel (рекомендуется)

Vercel идеален для этого проекта потому что:
- ✅ Бесплатно
- ✅ Автоматический деплой из Git
- ✅ Автоматический SSL (HTTPS)
- ✅ Глобальный CDN
- ✅ Поддержка serverless functions для backend

### Шаг 1: Подготовка GitHub

```bash
# Инициализируем Git в папке проекта
git init
git add .
git commit -m "Initial commit"

# Создайте репо на GitHub и push code
git remote add origin https://github.com/yourname/bayan-sulu.git
git branch -M main
git push -u origin main
```

### Шаг 2: Деплой Frontend на Vercel

```bash
cd client
npm install -g vercel
vercel
```

Следуйте инструкциям:
1. Войдите в аккаунт Vercel
2. Создайте новый проект
3. Выберите папку `client`
4. Vercel автоматически обнаружит Next.js/Vue.js
5. Нажмите Deploy

**Frontend URL**: `https://your-app.vercel.app`

### Шаг 3: Деплой Backend на Vercel

Vercel поддерживает serverless functions. Нужна реструктуризация:

Измените `server/server.js` для использования убийцы (handler):

```bash
cd server

# Установите Vercel CLI
npm install -g vercel

# Создайте vercel.json в корне server папки
```

Создайте `server/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "RESEND_API_KEY": "@resend_api_key",
    "EMAIL_FROM": "@email_from",
    "FRONTEND_URL": "@frontend_url"
  }
}
```

```bash
# Деплой на Vercel
vercel
```

**Backend URL**: `https://your-backend.vercel.app`

### Шаг 4: Обновите Frontend URL

В `client/vite.config.js` для production:

```js
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://your-backend.vercel.app',
        changeOrigin: true
      }
    }
  }
});
```

Пересоберите и деплойте frontend:

```bash
cd client
npm run build
vercel --prod
```

---

## 🚂 Альтернатива: Railway.app (проще для backend)

Railway отличный для простого backend, без сложностей с serverless:

### Frontend (Vercel, как выше)

### Backend (Railway):

1. Перейдите на https://railway.app
2. Создайте новый проект
3. Выберите "Deploy from GitHub"
4. Выберите репо с `server` папкой
5. Добавьте Environment Variables:
   - `MONGODB_URI`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `FRONTEND_URL`
6. Railway автоматически обнаружит скрипты в `server/package.json`
7. Деплойте!

**Railway Backend URL**: `https://your-app-production.up.railway.app`

---

## 🌐 Альтернатива: Render.com

Похоже на Railway, также хороший выбор:

1. Перейдите на https://render.com
2. Создайте "New Web Service"
3. Подключите GitHub
4. Deployment settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Добавьте环境变量
6. Деплойте!

---

## 📋 Финальный чек-лист для deployment

- [ ] Код в GitHub
- [ ] MongoDB аккаунт с connection string
- [ ] Resend аккаунт с API ключом
- [ ] Frontend на Vercel (или другой)
- [ ] Backend на Vercel/Railway/Render
- [ ] Environment переменные установлены везде
- [ ] Frontend URL обновлен в backend
- [ ] Backend URL обновлен в frontend proxy
- [ ] Отправите тестовое письмо
- [ ] Поделитесь ссылкой! 🎉

---

## 🔍 Тестирование после deployment

1. Откройте frontend URL
2. Заполните форму
3. Проверьте:
   - Форма отправляется без ошибок
   - Письмо приходит на email
   - Приглашение отображается красиво
   - Можно скачать файл
   - Можно скопировать ссылку

---

## 🆘 Troubleshooting

**Ошибка CORS при отправке**
→ Обновите `FRONTEND_URL` в backend env переменных

**Email не отправляется из production**
→ Убедитесь Resend API ключ правильный и не истек

**404 на `/api/invitations/submit`**
→ Проверьте backend URL и proxy в frontend config

**Serverless function timeout**
→ Может быть долгая операция с БД, используйте Railway вместо Vercel

---

Все готово! Ваш сайт приглашений живет в интернете! 🌟
