cd /www
cd bot.nyc
i=0;
while true; do
	((i++))
	casperjs bot.js --iteration=$i
	sleep 60
done