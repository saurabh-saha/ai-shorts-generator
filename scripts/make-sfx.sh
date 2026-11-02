#!/usr/bin/env bash
# Synthesizes the sound effects with ffmpeg (no external assets, no licensing).
set -euo pipefail
cd "$(dirname "$0")/../public/sfx"
F="ffmpeg -v error -y -f lavfi"
R="-ar 44100 -ac 1"

# request blip
$F -i "sine=f=1300:d=0.06" -af "afade=t=out:st=0.015:d=0.045,volume=0.5" $R blip.wav
# token plinks, rising pitch per token
i=0
for f in 523 587 659 698 784; do
  $F -i "sine=f=$f:d=0.4" -af "afade=t=out:st=0.01:d=0.39:curve=exp,volume=0.6" $R plink$i.wav
  i=$((i+1))
done
# request passes the limiter / token spent
$F -i "sine=f=480:d=0.1" -af "afade=t=out:st=0.02:d=0.08,volume=0.6" $R pop.wav
$F -i "sine=f=210:d=0.14" -af "afade=t=out:st=0.02:d=0.12,volume=0.7" $R spend.wav
# rejected: buzzer
$F -i "aevalsrc=sgn(sin(2*PI*120*t))*0.3:d=0.45:s=44100" -af "afade=t=out:st=0.3:d=0.15" $R buzz.wav
# overload alarm: two alternating tones
$F -i "sine=f=880:d=0.18" -f lavfi -i "sine=f=660:d=0.18" \
  -filter_complex "[0][1]concat=n=2:v=0:a=1,afade=t=out:st=0.3:d=0.06,volume=0.35" $R alarm.wav
# whoosh (limiter appears, end card)
$F -i "anoisesrc=d=0.6:c=pink:a=0.6" -af "highpass=f=400,lowpass=f=4500,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.35" $R whoosh.wav
# refill ding
$F -i "sine=f=1046:d=0.7" -af "afade=t=out:st=0.02:d=0.68:curve=exp,volume=0.55" $R ding.wav
ls -1
