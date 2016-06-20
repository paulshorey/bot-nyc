data=`curl -X GET http://api.allevents.nyc/sites | jq -c '.data[]'`

for site in $data
do 
	printf $site
	printf "\n \n"

	casperjs go.js $site

done
