# 🔧 Подробное руководство по настройке сервисов

## 1️⃣ MongoDB Atlas - База данных

### Почему MongoDB?
- Бесплатно (до 512 MB)
- Облачное хранилище (не нужно устанавливать локально)
- Легко масштабируется
- JSON-подобные документы (хорошо для JavaScript)

### Шаги настройки:

1. **Создайте аккаунт**
   - Перейдите на https://www.mongodb.com/cloud/atlas
   - Нажмите "Sign Up"
   - Заполните данные (используйте дополнительную email, не основную)

2. **Создайте бесплатный кластер**
   - After registration, нажмите "Create a Deployment"
   - Выберите "FREE" план
   - Выберите облачного провайдера (AWS рекомендуется)
   - Выберите регион (Moscow или Europe)
   - Нажмите "Create Deployment"
   - Дождитесь создания (обычно 2-3 минуты)

3. **Создайте пользователя базы данных**
   - На странице кластера перейдите в вкладку "Security"
   - Нажмите "Database Access"
   - Нажмите "ADD NEW DATABASE USER"
   - Username: `invitationuser` (или любое имя)
   - Password: создайте сильный пароль (сохраните его!)
   - Нажмите "Add User"

4. **Разрешите доступ с вашего IP**
   - На странице кластера нажмите "Network Access" или "Allow access from anywhere"
   - Нажмите "Add IP Address"
   - Выберите "Allow access from anywhere" (0.0.0.0/0) или добавьте ваш IP
   - Save

5. **Получите строку подключения**
   - На главной странице кластера нажмите "Connect"
   - Выберите "Drivers" > "Node.js"
   - Скопируйте строку подключения (Connection String)
   - Замените `<username>` и `<password>` на ваши данные
   - Пример:
     ```
     mongodb+srv://invitationuser:MyStrongPassword123@cluster0.abc123.mongodb.net/invitation_db?retryWrites=true&w=majority
     ```

6. **Создайте базу данных (опционально)**
   - Перейдите в "Collections"
   - Нажмите "Create Database"
   - Name: `invitation_db`
   - Collection: `responses`

**Сохраните connection string! Она нужна для .env**

---

## 2️⃣ Resend - Email сервис

### Почему Resend?
- Бесплатные письма (100 в день на фоне разработки)
- Простой API
- Встроенная поддержка для Node.js
- Красивые шаблоны email

### Шаги настройки:

1. **Создайте аккаунт**
   - Перейдите на https://resend.com
   - Нажмите "Sign Up"
   - Используйте свой email

2. **Подтвердите email**
   - Проверьте ваш email
   - Нажмите ссылку подтверждения

3. **Добавьте домен (опционально, для собственного email)**
   - Если хотите отправлять с `hello@yourdomain.com`:
     - На панели Resend нажмите "Domains"
     - Нажмите "Add Domain"
     - Введите ваш домен
     - Добавьте DNS записи (инструкции на экране)
   
   - Если просто используете Resend email:
     - Пропустите этот шаг
     - Будет отправлять с `noreply@resend.dev` (это нормально)

4. **Получите API ключ**
   - На панели Resend нажмите "API Keys"
   - Нажмите "Create API Key"
   - Скопируйте ключ (распечатается только один раз!)
   - Пример: `re_1234567890abcdefg`

**Сохраните API ключ! Он нужен для .env**

---

## 3️⃣ Добавление в .env файл

Создайте файл `server/.env`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://invitationuser:MyStrongPassword123@cluster0.abc123.mongodb.net/invitation_db?retryWrites=true&w=majority

# Resend Email
RESEND_API_KEY=re_1234567890abcdefg
EMAIL_FROM=noreply@resend.dev

# Frontend URL (для CORS)
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=3001
```

### Замены:
- `invitationuser` → ваше имя пользователя MongoDB
- `MyStrongPassword123` → ваш пароль
- `cluster0.abc123` → ваш адрес кластера (из connection string)
- `re_1234567890abcdefg` → ваш Resend API ключ
- `noreply@resend.dev` → ваш email (или свой домен)

---

## 4️⃣ Тестирование

```bash
cd server

# Проверьте, что сервер запускается
npm run dev

# Вы должны увидеть:
# ✓ Connected to MongoDB
# ✓ Server running on http://localhost:3001
```

Если видите ошибки:
- **MongoDB error** → проверьте connection string и IP whitelist
- **Cannot find module** → запустите `npm install`

---

## 5️⃣ После локального тестирования

Для развертывания на production добавьте переменные типа:
- На Vercel → добавьте в Project Settings → Environment Variables
- На Railway → добавьте через dashboard
- На других платформах → их документация

---

## 🎯 Проверочный список:

- [ ] MongoDB аккаунт создан
- [ ] Кластер создан и работает
- [ ] Пользователь БД создан
- [ ] Connection string скопирован
- [ ] Resend аккаунт создан
- [ ] API ключ Resend скопирован
- [ ] Файл `server/.env` создан с данными
- [ ] Сервер запускается без ошибок
- [ ] Фронтенд подключается к серверу

---

**Готово! Теперь вы можете запустить приложение:**

```bash
# Терминал 1
cd server && npm run dev

# Терминал 2
cd client && npm run dev
```

Откройте http://localhost:5173 и начните приглашать гостей! 🎉
