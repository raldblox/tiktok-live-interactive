#!/bin/sh
# Makes the stream copies of every clip: 720p clips in videos/final/ -> 1080x1920 in videos/final1080/.
# - Lanczos upscale + light sharpening looks clearly crisper on stream than the browser's own scaling.
# - The first and last frame of each clip are dropped: those are the keyframe images themselves, and the
#   model's own frames right next to them differ slightly, which shows as a tiny pop at every cut.
# - Tagged BT.601, which is how the video model encodes its colors. Untagged, browsers (LIVE Studio too)
#   assume BT.709 and the oranges come out about 7% oversaturated.
# Each file is written aside and swapped in at once, so a running stream never reads a half-written clip.
# Only clips that are new or changed are processed. Run from anywhere:  sh season2/upscale.sh  (add -f to redo all)
# GRADE: the softer, cooler look the user picked (option 3): a little less red/more blue in shadows, mids and
# highlights, 12% less saturation, slightly lifted midtones. Set GRADE="null" to build without it.
# It must run on the 720-wide frames, BEFORE the upscale: colorbalance on 1080-wide planar frames leaves the
# last 8 columns as a solid blue strip (1080 isn't a multiple of 16).
GRADE="format=gbrp,colorbalance=rs=-0.03:bs=0.04:rm=-0.06:bm=0.05:rh=-0.04:bh=0.03,format=yuv420p,eq=saturation=0.88:gamma=1.06:contrast=0.98"
cd "$(dirname "$0")/videos" || exit 1
mkdir -p final1080
for f in final/*.mp4; do
  out="final1080/$(basename "$f")"
  [ "$1" != "-f" ] && [ -f "$out" ] && [ "$out" -nt "$f" ] && continue
  n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f")
  fps=$(ffprobe -v error -select_streams v -show_entries stream=r_frame_rate -of csv=p=0 "$f")
  last=$((n - 2))
  ffmpeg -loglevel error -y -i "$f" \
    -vf "trim=start_frame=1:end_frame=$((n - 1)),setpts=PTS-STARTPTS,$GRADE,scale=1080:1920:flags=lanczos,unsharp=5:5:0.35:5:5:0" \
    -af "atrim=start=$(awk "BEGIN{split(\"$fps\",a,\"/\"); print a[2]/a[1]}"):end=$(awk "BEGIN{split(\"$fps\",a,\"/\"); print ($n-1)*a[2]/a[1]}"),asetpts=PTS-STARTPTS" \
    -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -g 48 -movflags +faststart \
    -color_primaries smpte170m -color_trc smpte170m -colorspace smpte170m -color_range tv \
    -c:a aac -b:a 160k "$out.tmp.mp4" && mv -f "$out.tmp.mp4" "$out" && echo "built $(basename "$f") ($last frames)"
done
