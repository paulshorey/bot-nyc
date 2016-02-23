cd /www
cd bot.nyc
i=1;
while true; do
	casperjs bot.js --iteration=$i
	sleep 60
	((i++))
done