rm -rf logs
http-server logs -p 8000 -d false -s -c 540

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/ps1-git

casperjs bot.js

# while true; do
# 	casperjs bot.js
# 	sleep 30
# done