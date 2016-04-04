sleep 10

cd /www/bot-nyc

echo http-server starting... :9080
http-server public -p 9080 -s -c 30 #-d false