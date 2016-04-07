sleep 10

cd /www/bot-nyc

echo http-server starting... :2000
http-server public -p 2000 -s -c 30 #-d false