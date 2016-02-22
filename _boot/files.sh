iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8000
rm -rf /www/public/console/logs
http-server /www/public/console -p 8000 -s -c 30 #-d false