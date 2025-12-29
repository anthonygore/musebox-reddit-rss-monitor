# To update the app

```
ssh root@137.184.43.172
cd /opt/musebox-rss-monitor
git fetch
git pull origin main
pm2 restart reddit-rss-monitor
```
