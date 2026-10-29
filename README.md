# WebLarek — интернет-магазин с защищённым сервером

Магазин продаёт товары (карточки с изображением, категорией и ценой). Пользователь регистрируется, входит в систему, добавляет товары в корзину и оформляет заказ. Администратор управляет товарами, заказами и покупателями.

Исходный сервер WebLarek содержал уязвимости. Выполнены: защита от CSRF, санитизация пользовательского ввода, проверка ролей и прав доступа, ограничение запросов, безопасная загрузка файлов и аудит зависимостей.

## Стек

| Часть    | Технологии                                                                |
| -------- | ------------------------------------------------------------------------- |
| Backend  | Node.js, Express 4, TypeScript, MongoDB + Mongoose 8, Joi (celebrate), JWT, bcryptjs, csurf, cookie-parser, express-rate-limit, multer, sharp, sanitize-html |
| Frontend | React, TypeScript, Vite 6, SCSS-модули                                    |
| Инфра    | Docker Compose, nginx, MongoDB                                            |

## Развёртывание

Нужны Docker и Docker Compose.

1. Склонируйте репозиторий и перейдите в каталог проекта.
2. Создайте файлы переменных окружения для backend и frontend на основе примеров:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   В `backend/.env` задайте секреты для JWT (`AUTH_ACCESS_TOKEN_SECRET`, `AUTH_REFRESH_TOKEN_SECRET`). В Docker адрес базы — `DB_ADDRESS=mongodb://mongo:27017/...`, как указано в комментарии к переменной в `.env.example`.

3. Запустите контейнеры:

   ```bash
   docker compose up -d
   ```

4. Откройте приложение: [http://localhost/](http://localhost/). На главной должны отображаться товары.
5. Вход: [http://localhost/login/](http://localhost/login/).
6. Админ-панель: [http://localhost/admin/](http://localhost/admin/).

MongoDB в compose пробрасывается на хост-порт `27018`.

## Структура проекта

```
bad-server/
├── backend/
│   ├── src/
│   │   ├── app.ts              # точка входа: лимитер, cookie, CSRF, CORS, маршруты, подключение к MongoDB
│   │   ├── config.ts           # переменные окружения: JWT, срок жизни токенов, cookie refresh-токена
│   │   ├── routes/             # маршруты: auth, product, order, upload, customers
│   │   ├── controllers/        # обработчики запросов
│   │   ├── middlewares/        # auth (JWT и роли), validations (Joi), file (multer), error-handler
│   │   ├── models/             # схемы Mongoose: user, product, order, counter
│   │   ├── errors/             # классы HTTP-ошибок
│   │   └── utils/              # validation, movingFile, escapeRegExp
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # UI: каталог, корзина, заказ, профиль, админ-панель
│   │   ├── pages/              # страницы: main, login, register, logout, admin
│   │   ├── utils/              # weblarek-api.ts — клиент API с CSRF-токеном
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── nginx/
│   └── nginx.conf              # раздача фронтенда и проксирование /api на backend
├── .github/workflows/
│   └── tests.yml               # запуск проектных тестов в GitHub Actions
├── docker-compose.yml          # frontend, mongo, backend, server (nginx)
└── README.md
```

## Что исправлено

Исправления описаны по коду. Их порядок соответствует истории коммитов.

- **CSRF.** Сервер выдаёт токен на `GET /auth/csrf-token`, все небезопасные запросы проверяются через `csurf` с cookie. Клиент (`frontend/src/utils/weblarek-api.ts`) получает токен и отправляет его в заголовке `X-CSRF-Token`.
- **Санитизация комментариев.** Комментарий к заказу очищается через `sanitize-html` в [controllers/order.ts](backend/src/controllers/order.ts) и ограничен 100 символами в Joi-схеме.
- **Валидация телефона.** Телефон проверяется Joi-шаблоном в `validateOrderBody` и регулярным выражением в схеме заказа (`models/order.ts`).
- **Проверка роли.** Маршруты администратора для товаров (`product.ts`), заказов (`/order/all`, смена статуса, удаление) и покупателей (`/customers`, все методы) защищены `roleGuardMiddleware(Role.Admin)`. Пользователь получает доступ к своим заказам через `/order/all/me` и `/order/me/:orderNumber`.
- **Ограничение запросов.** `express-rate-limit`: не более 50 запросов в минуту на один клиент.
- **Загрузка файлов.** Фильтр по MIME-типу изображений в `middlewares/file.ts`. Имя файла заменяется на UUID, исходное имя не используется. В контроллере проверяются размер (от 2 КБ до 10 МБ), наличие и корректность метаданных изображения через `sharp`.
- **Аудит зависимостей.** Обновлены уязвимые пакеты, в `backend/package.json` есть `overrides` для `cookie`, во фронтенде обновлён Vite.

## Моя зона ответственности

Проект выполнен мной единолично. Я отвечал за безопасность бэкенда: исправил уязвимости, перечисленные выше, и сделал аудит зависимостей.
