sleep 10

cd /www/bot.allevents.nyc

echo http-server starting... :2000
http-server html -p 2000 -s -c 30 #-d false