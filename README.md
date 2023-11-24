# LINKS KomAG Telegram Bot

Telegram bot to fetch community management shifts from nextcloud and send todays shifts to a telegram group.

## Deployment

```cp .env.copy .env```

Put bot token, nextcloud credentials, filepath of the csv file and a telegram chat id.

```docker compose up --build -d```