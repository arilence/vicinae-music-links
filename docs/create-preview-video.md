1. Reset Vicinae's settings to their defaults.

```bash
mv --no-clobber \
  ~/.config/vicinae/settings.json \
  ~/.config/vicinae/settings.json.preview-video-backup \
  && systemctl --user restart vicinae.service
```

2. Open [this 1280×720 solid-color image](https://www.singlecolorimage.com/get/2a2d36/1280x720)
   in fullscreen mode to use it as the screen recording background.

3. Record an MP4 video at 30 FPS. In my case, the niri window manager doesn't work well with many
   recommended screen recorders, so I opted for the behemoth that is OBS.

```bash
nix run nixpkgs#obs-studio
```

4. Trim, crop, and resize the recording. The `-ss` option specifies the start timestamp, and `-to`
   specifies the end timestamp.

```bash
nix run nixpkgs#ffmpeg -- \
  -ss 2 \
  -to 11 \
  -i recording.mp4 \
  -vf "crop=820:560:(iw-820)/2:(ih-520)/2,scale=700:-2:flags=lanczos,format=yuv420p" \
  -an \
  -c:v libx264 \
  -crf 20 \
  -preset medium \
  -movflags +faststart \
  demo.mp4
```

5. Edit `README.md` on GitHub, then drag and drop `demo.mp4` into the editor to upload it.

6. Restore Vicinae's settings.

```bash
mv \
  ~/.config/vicinae/settings.json.preview-video-backup \
  ~/.config/vicinae/settings.json \
  && systemctl --user restart vicinae.service
```
