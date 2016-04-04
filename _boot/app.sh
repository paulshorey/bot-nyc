cd /www/bot-nyc

i=0;
while true; do
	i=$[$i+1]
	casperjs casper.js --iteration=$i
	sleep 60
done