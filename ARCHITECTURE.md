# 🏗️ Архитектура проекта / Project Architecture

## 📊 System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      INTERNET / ИНТЕРНЕТ                     │
└─────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
        ┌───────────▼────────┐    ┌──▼──────────────┐
        │  FRONTEND (Vue)    │    │  BACKEND (Node) │
        │  localhost:5173    │    │  localhost:3001 │
        │                    │    │                 │
        │  - Красивая форма  │◄──►│  - Express API  │
        │  - Валидация       │    │  - MongoDB ORM  │
        │  - Приглашение     │    │  - Email service│
        │  - Скачивание      │    │  - Статистика   │
        └────────────────────┘    └────────┬────────┘
                    │                      │
                    │              ┌───────▼────────┐
                    │              │ MONGODB ATLAS  │
                    │              │                │
                    │              │ - responses    │
                    │              │   collection   │
                    │              └────────────────┘
                    │
                    └──────────────────────┐
                                           │
                                  ┌────────▼───────┐
                                  │ RESEND.COM     │
                                  │                │
                                  │ Email SMTP     │
                                  │ Service        │
                                  └────────────────┘
```

## 🔄 Data Flow

### 1️⃣ Пользователь заходит на сайт

```
User Browser
    │
    ├─→ GET http://localhost:5173
    │   ├─→ index.html
    │   ├─→ App.vue (Vue компонент)
    │   └─→ Загружается форма
    │
    └─→ Показывается красивая форма
```

### 2️⃣ Пользователь заполняет форму

```
Form Input
├─ Name: "Алишер"
├─ Email: "user@example.com"
└─ willAttend: true/false
```

### 3️⃣ Отправка на сервер

```
Vue.js App
    │
    ├─→ POST /api/invitations/submit
    │   └─→ Body: {name, email, willAttend, eventKey}
    │
    └─→ Express Server получает запрос
```

### 4️⃣ Сохранение в БД

```
Express Server
    │
    ├─→ Подключение к MongoDB
    │
    ├─→ db.collection('responses').insertOne({
    │   ├─ name: "Алишер"
    │   ├─ email: "user@example.com"
    │   ├─ willAttend: true
    │   ├─ createdAt: 2024-04-10
    │   └─ invitationSent: false
    │  })
    │
    └─→ _id: ObjectId создается автоматически
```

### 5️⃣ Отправка Email

```
Express Server
    │
    ├─→ Генерирует красивый HTML
    │   └─→ generateInvitationHTML(name, willAttend)
    │
    ├─→ Отправляет через Resend API
    │   └─→ POST https://api.resend.com/emails
    │       └─→ to: "user@example.com"
    │           with beautiful HTML
    │
    └─→ Обновляет invitationSent: true
```

### 6️⃣ Ответ клиенту

```
Express Server
    │
    └─→ Response {
        ├─ success: true
        ├─ id: ObjectId
        └─ invitationHTML: "<html>..."
        }
    │
    ├─→ Vue получает ответ
    │
    └─→ Показывает красивое приглашение в браузере
```

### 7️⃣ Пользователь может:

```
┌─────────────────────┬────────────────────┬──────────────────┐
│  Скачать файл       │ Поделиться ссылкой │ Отправить еще    │
├─────────────────────┼────────────────────┼──────────────────┤
│ Создает HTML blob   │ Копирует URL в     │ Очищает форму    │
│ и скачивает как     │ clipboard (с       │ для новой рассылки│
│ invitation.html     │ готовой ссылкой)   │                  │
└─────────────────────┴────────────────────┴──────────────────┘
```

---

## 🗃️ Model / Schema

### MongoDB Collection: `responses`

```json
{
  "_id": ObjectId("..."),
  "name": String,          // "Алишер"
  "email": String,         // "user@example.com"
  "willAttend": Boolean,   // true или false
  "eventKey": String,      // "bayanSulu2026"
  "createdAt": Date,       // Автоматически
  "invitationSent": Boolean // true или false
}
```

### Примеры документов:

```json
// Гость приходит
{
  "_id": ObjectId("607f1f77bcf86cd799439011"),
  "name": "Гулhарa",
  "email": "gulhara@example.com",
  "willAttend": true,
  "eventKey": "bayanSulu2026",
  "createdAt": ISODate("2024-04-10T10:30:00Z"),
  "invitationSent": true
}

// Гость не может прийти
{
  "_id": ObjectId("607f1f77bcf86cd799439012"),
  "name": "Алмас",
  "email": "almas@example.com",
  "willAttend": false,
  "eventKey": "bayanSulu2026",
  "createdAt": ISODate("2024-04-10T11:15:00Z"),
  "invitationSent": true
}
```

---

## 🛣️ API Routes

### GET /api/health
**Описание**: Проверяет, жив ли сервер  
**Response**: `{status: "Server is running"}`

### POST /api/invitations/submit
**Описание**: Отправляет ответ гостя и отправляет email  
**Request Body**:
```json
{
  "name": "Гостя имя",
  "email": "guest@example.com",
  "willAttend": true,
  "eventKey": "bayanSulu2026"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Invitation submitted successfully",
  "id": "607f1f77bcf86cd799439011",
  "invitationHTML": "<html>..."
}
```

### GET /api/invitations/stats
**Описание**: Получает статистику ответов  
**Response**:
```json
{
  "total": 50,
  "attending": 35,
  "notAttending": 15,
  "percentAttending": 70
}
```

---

## 📚 Technology Stack

### Frontend
- **Vue.js 3** - Reactive UI framework
- **Vite** - Fast build tool
- **Axios** - HTTP client
- **CSS3** - Styling (градиенты, анимации)

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database (NoSQL)
- **Resend** - Email service
- **CORS** - Cross-origin support
- **dotenv** - Environment variables

### DevTools
- **npm** - Package manager
- **nodemon** - Auto-restart on changes
- **Vercel CLI** - Deployment

---

## 🚀 Deployment Architecture

```
LOCAL DEVELOPMENT (localhost)
├─ Frontend: http://localhost:5173
└─ Backend: http://localhost:3001

PRODUCTION (Cloud)
├─ Frontend: https://app-name.vercel.app (Vercel)
├─ Backend: https://api-name.vercel.app (Vercel/Railway/Render)
├─ Database: MongoDB Atlas (MongoDB)
└─ Email: Resend API (Resend.com)
```

---

## 🔐 Security Notes

⚠️ **Current Setup (Development)**:
- MongoDB uri в .env (скрыт в .gitignore)
- API ключи в .env (скрыты в .gitignore)
- CORS открыт для FRONTEND_URL

✅ **Production Ready**:
- Используйте переменные окружения платформы (Vercel, Railway)
- Не коммитьте .env файлы в Git
- Добавьте rate limiting для API
- Используйте HTTPS (автоматически на облаке)
- Валидируйте email перед отправкой

---

## 📊 How it scales

```
100 приглашений
├─ ~100 MongoDB записей (~1MB)
├─ ~100 emails отправлено (~10KB каждое в логах)
└─ Все это бесплатно!

1000 приглашений
├─ ~1000 MongoDB записей (~10MB)
├─ ~1000 emails
├─ Может потребоваться платный MongoDB план
└─ Resend требует оплаты

10000+ приглашений
├─ Рассмотрите нагрузку на БД
├─ Добавьте индексы в MongoDB
├─ Кэшируйте статистику
└─ Рассмотрите Kafka для очереди emails
```

---

Вот как всё работает вместе! 🎯
