#!/bin/sh
# Paints the hidden "Reaper Pro Max" artist signature onto the room painting.
# AI garbles tiny text, so after any room re-render: save the raw render as season2/room-raw.png,
# check the canvas corner is still at about (355, 1013), then run: sh season2/sign-room.sh
cd "$(dirname "$0")"
F="C\:/Windows/Fonts/BRUSHSCI.TTF"
ffmpeg -loglevel error -y -i room-raw.png -f lavfi -i "color=c=black@0.0:s=130x40,format=rgba" -filter_complex \
 "[0]delogo=x=258:y=987:w=98:h=24[bg];[1]drawtext=fontfile='$F':text='Reaper Pro Max':fontcolor=0xc49a55@0.9:fontsize=16:x=w-tw-5:y=h-th-7,rotate=-5*PI/180:c=black@0:ow=130:oh=40[sig];[bg][sig]overlay=x=355-130:y=1013-40:shortest=1" \
 -frames:v 1 room.png && echo "signed room.png"
