# Server Deployment

Этот backend подготовлен под два режима:

- локально: `npm run dev`
- на Vercel: root directory проекта должен быть `server`, entrypoint определяется автоматически через `src/index.ts`

## Переменные окружения

Нужно задать:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `TELEGRAM_BOT_TOKEN`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS`
- `CORS_ORIGIN` - домен client-приложения, например `https://your-client-project.vercel.app`

## MongoDB Atlas Free

1. Создать Free cluster.
2. Создать отдельного database user.
3. Взять connection string формата `mongodb+srv://...`.
4. Разрешить доступ приложению из Vercel.

## Vercel

1. Импортировать репозиторий как monorepo project.
2. Для backend-проекта выбрать `Root Directory = server`.
3. Добавить все env-переменные в Vercel Project Settings.
4. Задеплоить проект.

## Client

Для отдельного client-проекта на Vercel нужно задать `VITE_API_BASE_URL` со значением URL backend-проекта.
