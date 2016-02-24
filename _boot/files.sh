iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 2080
cd /www/bot-nyc
rm -rf public/console/logs
echo starting http-server
http-server public -p 2080 -s -c 30 #-d false