# TG Clicker+ FINAL (Telegram WebApp)

## Как поставить (правильно)

### 1) GitHub
Распакуй архив и залей **содержимое папки** в репозиторий так, чтобы в корне были:
- `index.html`
- папки `assets/` и `api/`

Это критично, иначе будут проблемы с ассетами/роутами.

### 2) Vercel Deploy
Vercel → New Project → Import GitHub repo → Deploy.

После деплоя возьми ссылку ТОЛЬКО из:
**Project → Domains → Production Domain**
Она выглядит как:
`https://project-name.vercel.app`

⚠️ Не используй ссылки preview / deployment-id — они дают `DEPLOYMENT_NOT_FOUND`.

### 3) Проверка
Открой:
- `https://project-name.vercel.app/assets/coin.png` (монета должна открыться)
- `https://project-name.vercel.app/api/health` (ok:true)

### 4) Подключить к твоему старому боту (раннер → кликер)
В `.env` твоего бота просто замени:
`WEBAPP_URL=https://project-name.vercel.app`
и перезапусти бота.

## Supabase (чтобы прогресс не сбрасывался)
В Supabase создай таблицы:

```sql
create table if not exists public.progress (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

```

В Vercel → Settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Антинакрутка (по желанию)
В Vercel env добавь:
- `TELEGRAM_BOT_TOKEN` = токен твоего бота
Тогда API будет принимать POST только с валидным Telegram initData.
