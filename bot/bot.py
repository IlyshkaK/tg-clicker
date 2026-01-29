import os
from aiogram import Bot, Dispatcher, executor, types
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")

bot = Bot(TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start"])
async def start(m: types.Message):
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton("🪙 Играть", web_app=types.WebAppInfo(url=WEBAPP_URL)))
    await m.answer("Открываю кликер 👇", reply_markup=kb)

if __name__ == "__main__":
    if not TOKEN or not WEBAPP_URL:
        raise SystemExit("Нужны BOT_TOKEN и WEBAPP_URL в .env (см. bot/.env.example)")
    executor.start_polling(dp, skip_updates=True)
