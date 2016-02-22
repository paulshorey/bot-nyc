iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8000
rm -rf console
http-server console -p 8000 -s -c 30 #-d false