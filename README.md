# TG Clicker (Telegram WebApp) — кликер с сохранением

## Что внутри
- Клик по монете (+сила клика * множитель)
- Авто-майнер (+монеты/сек)
- Множитель x2
- Оффлайн доход
- Сохранение:
  - localStorage (всегда)
  - серверное через `/api/progress` (best-effort)
- Ассет монеты: `/assets/coin.png`

## Деплой на Vercel
Важно: `index.html` и папка `assets/` лежат В КОРНЕ репозитория.

Проверка после деплоя:
- `https://xxx.vercel.app/` — игра
- `https://xxx.vercel.app/assets/coin.png` — монета (должна открываться)
- `https://xxx.vercel.app/api/health` — API

## Бот
В `bot/`:
1) `.env.example` → `.env`
2) Впиши `BOT_TOKEN` и `WEBAPP_URL`
3) Запуск:
```bash
pip install -r requirements.txt
python bot.py
```

## Постоянное сохранение (Supabase) — рекомендую
Без Supabase прогресс в `/api/progress` может сбрасываться (serverless memory).

### Таблица
```sql
create table if not exists public.progress (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
```

### Env в Vercel
Project → Settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (service_role)
