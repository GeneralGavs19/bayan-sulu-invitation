# Инструкции для настройки и запуска

## Структура проекта

```
project/
├── client/              # Vue.js фронтенд
│   ├── src/
│   │   ├── App.vue     # Главный компонент
│   │   └── main.js     # Точка входа
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/             # Node.js бэкенд
│   ├── server.js       # Express приложение
│   ├── package.json
│   └── .env.example
└── README.md           # Полная документация
```

## Быстрый старт

### 1️⃣ Подготовка

1. Создайте аккаунт на [MongoDB Atlas](https://mongodb.com)
2. Создайте бесплатный кластер
3. Скопируйте connection string (вместо password и username)
4. Создайте аккаунт на [Resend.com](https://resend.com)
5. Скопируйте API ключ

### 2️⃣ Бэкенд

```bash
cd server
npm install

# Создайте .env файл с вашими данными:
# MONGODB_URI=mongodb+srv://...
# RESEND_API_KEY=re_...
# EMAIL_FROM=noreply@example.com
# FRONTEND_URL=http://localhost:5173
# PORT=3001

npm run dev  # Сервер запустится на :3001
```

### 3️⃣ Фронтенд (новый терминал)

```bash
cd client
npm install
npm run dev  # Откроется на localhost:5173
```

## Как это работает

1. **Пользователь заполняет форму** - вводит имя, email, выбирает "Приду/Не приду"
2. **Форма отправляется на сервер** - данные сохраняются в MongoDB
3. **Отправляется email** - красиво оформленное приглашение
4. **Показывается красивое приглашение** - на экране отображается персонализованное приглашение
5. **Можно скачать/поделиться** - получает HTML файл или ссылку

## Что дальше?

### Развертывание на Vercel

**Frontend:**
```bash
cd client
vercel
```

**Backend:** требует платформы с поддержкой Node.js. Опции:
- Vercel (serverless functions)
- Railway.app
- Render.com
- Heroku

### Кастомизация

Измените в `client/src/App.vue`:
- Название события: "Баян Сулу"
- Цвета: `#667eea`, `#764ba2`
- Тексты: русский/английский

## Возможные проблемы

**Ошибка: Cannot find module 'axios'**
→ Запустите `npm install` в папке

**Ошибка: MongoDB connection failed**
→ Проверьте connection string и IP в whitelist

**Email не отправляется**
→ Проверьте Resend API ключ и домен

---

**Вопросы?** - Смотрите README.md для полной документации!
