#iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 2080

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/ps1-git
cd /www/bot-nyc
git reset HEAD -\-hard;
git pull

# i=0;
# while true; do
# 	i=$[$i+1]
# 	echo casperjs haunt.js \#$i starting...
# 	casperjs bot.js --iteration=$i
# 	sleep 60
# done