#!/bin/bash

# config
output_dir=./chess_games
game_max_id=10241
game_base_url='http://www.xqbase.com/xqbase/?gameid='

echo 'begin task...'
# parameter @url
function get_html(){
   url=$1
   curl $1 2>/dev/null |
        # filter unsupported characters of iconv
        sed -r '/(<\/title>|<\/b>|<\/font>)/d'|
        # convert charset from GB2312 to UTF8
        iconv -f GB2312 -t UTF8 |grep -Pzo "(?s)^\N*pre.*</pre.*?" |
        # get valid game data
        grep -Pzo "(?s)^\N*1\..*\).*?" |
        # select useful columns
        cut -d . -f2,3,4,5 |
        # remove the ^M at the end of the line
        tr -d '\r' > $output_dir/game_${url##*=}
}

[ ! -d $output_dir ] && mkdir -p $output_dir



for((i=1;i<=$game_max_id;i++));do
    get_html $game_base_url$i
    [ -f $output_dir/game_$i ] && echo game retrieved:$i, percent: $(printf "%.2f" `echo "100*$i/$game_max_id"|bc`)%
    if [ $? -gt 0 ];then
        echo 'error occurd, sleep for 2 seconds'
        sleep 2s
    fi
done

echo "task finished..."