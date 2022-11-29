from telethon import TelegramClient
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os

load_dotenv()

api_id = int(os.getenv('TELEGRAM_API_ID'))
api_hash = os.getenv('TELEGRAM_API_HASH')
session_name = os.getenv('TELEGRAM_SESSION_NAME')
chat_id = int(os.getenv('TELEGRAM_GROUP_CHAT_ID'))

client = TelegramClient(session_name, api_id, api_hash)

def utc_to_local(utc_dt):
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=None)

async def download_images():
    offset_date = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(1)
    print(offset_date)
    async for message in client.iter_messages(chat_id, reverse = True, offset_date = offset_date):
        if message.photo:
            await client.download_media(message.media, 
                "./media/photo_" + utc_to_local(message.date).strftime("%Y_%m_%d_%H_%M_%S"))

with client:
    client.loop.run_until_complete(download_images())
