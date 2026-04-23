# Gess Mini App

В корне проекта живет frontend Telegram Mini App на React + Vite. Backend для авторизации, рекордов и лидербордов вынесен в папку `server/`.

## Что умеет backend

- регистрирует пользователя при первом успешном входе через Telegram Mini App;
- хранит пользователей и рекорды в MongoDB Atlas Free;
- обновляет рекорд только если новый результат выше предыдущего;
- отдает top-10 по `runner` и `match`;
- валидирует `Telegram.WebApp.initData` на сервере;
- хранит чувствительные данные только в переменных окружения.

## Стек backend

- Node.js + Express + TypeScript
- MongoDB Atlas Free + Mongoose
- JWT для серверной сессии
- Helmet, CORS, express-rate-limit

## Быстрый старт backend

1. Установить зависимости:

```bash
cd server
npm install
```

2. Создать `.env` из шаблона:

```bash
cp .env.example .env
```

3. Заполнить переменные:

- `MONGODB_URI`
- `TELEGRAM_BOT_TOKEN`
- `JWT_SECRET`
- `CORS_ORIGIN`

4. Запустить backend:

```bash
npm run dev
```

По умолчанию сервер стартует на `http://localhost:4000`.

## Root scripts

Из корня проекта доступны:

```bash
npm run server:dev
npm run server:build
```

## MongoDB Atlas Free

Для этой задачи выбран MongoDB Atlas Free: он хорошо сочетается с Mongoose, подходит для простой облачной бесплатной базы и не требует держать собственный сервер базы данных.

Минимальная схема пользователя:

```ts
telegramId: { type: Number, unique: true, required: true }
username: { type: String, required: true }
registrationDate: { type: String, default: () => formatDate(new Date()) }
scoreRunner: { type: Number, default: 0 }
scoreMatch: { type: Number, default: 0 }
```

## API

### `POST /api/auth/telegram`

Регистрирует пользователя при первом входе или возвращает уже существующего.

Body:

```json
{
  "initData": "<Telegram.WebApp.initData>"
}
```

Response:

```json
{
  "token": "<jwt>",
  "user": {
    "telegramId": 123456789,
    "username": "player",
    "registrationDate": "23:04:2026_21:45:11",
    "scoreRunner": 0,
    "scoreMatch": 0
  }
}
```

### `GET /api/auth/me`

Возвращает текущего пользователя.

Header:

```text
Authorization: Bearer <jwt>
```

### `POST /api/scores/runner`
### `POST /api/scores/match`

Обновляет рекорд только если новый результат выше старого.

Body:

```json
{
  "score": 1540
}
```

### `GET /api/leaderboards/runner?limit=10`
### `GET /api/leaderboards/match?limit=10`

Возвращает лидерборд по нужной игре.

## Что отправлять с клиента

- На backend нужно отправлять именно `Telegram.WebApp.initData`, а не `initDataUnsafe`.
- JWT из `/api/auth/telegram` нужно использовать для `/api/auth/me` и `/api/scores/*`.
- Если у пользователя нет `username` в Telegram, backend сам подставит безопасный fallback, чтобы поле оставалось обязательным.

## Безопасность

- `TELEGRAM_BOT_TOKEN`, `JWT_SECRET` и `MONGODB_URI` не хранятся в коде.
- `initData` проверяется по HMAC согласно Telegram Mini Apps.
- `auth_date` проверяется на устаревание.
- На auth и score endpoints включен rate limiting.
- CORS ограничивается списком доменов из env.
