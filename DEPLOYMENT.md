# To update the app

```
ssh root@137.184.43.172
cd /opt/musebox-rss-monitor
git fetch
git pull origin main
npm i
pm2 restart reddit-rss-monitor --update-env
```

# To check logs

```
pm2 logs reddit-rss-monitor
```
