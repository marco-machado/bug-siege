#!/usr/bin/env bash
#
# Trim transparent padding and resize sprite PNGs to 64x64.
#
# Usage:
#   ./scripts/trim-sprite.sh assets/sprites/blaster.png
#   ./scripts/trim-sprite.sh assets/sprites/*.png
#   ./scripts/trim-sprite.sh assets/sprites/core.png --spritesheet 4x4
#   ./scripts/trim-sprite.sh assets/sprites/core.png --spritesheet

set -euo pipefail

SPRITESHEET=""
GRID_COLS=""
GRID_ROWS=""
FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --spritesheet)
      SPRITESHEET=1
      if [[ ${2:-} =~ ^[0-9]+x[0-9]+$ ]]; then
        GRID_COLS="${2%%x*}"
        GRID_ROWS="${2##*x}"
        shift
      fi
      shift
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "Usage: $0 <file.png> [file2.png ...] [--spritesheet [COLSxROWS]]"
  exit 1
fi

process_single() {
  local file="$1"
  magick "$file" -trim +repage -resize 64x64 -gravity center -background none -extent 64x64 "$file"
  echo "done: $file ($(magick identify -format '%wx%h' "$file"))"
}

process_spritesheet() {
  local file="$1"
  local cols="$GRID_COLS"
  local rows="$GRID_ROWS"

  local dims
  dims=$(magick identify -format '%w %h' "$file")
  local img_w img_h
  read -r img_w img_h <<< "$dims"

  if [[ -z "$cols" || -z "$rows" ]]; then
    cols=$((img_w / 64))
    rows=$((img_h / 64))
    echo "auto-detected: ${cols}x${rows} grid (${img_w}x${img_h} image)"
  fi

  local frame_w=$((img_w / cols))
  local frame_h=$((img_h / rows))
  local temp_dir
  temp_dir=$(mktemp -d)
  trap "rm -rf '$temp_dir'" RETURN

  for ((r = 0; r < rows; r++)); do
    for ((c = 0; c < cols; c++)); do
      local n=$((r * cols + c))
      local x=$((c * frame_w))
      local y=$((r * frame_h))
      magick "$file" -crop "${frame_w}x${frame_h}+${x}+${y}" +repage \
        -trim +repage -resize 64x64 -gravity center -background none -extent 64x64 \
        "$temp_dir/frame_$(printf '%03d' "$n").png"
    done
  done

  magick montage "$temp_dir"/frame_*.png -tile "${cols}x${rows}" -geometry 64x64+0+0 -background none "$file"
  echo "done: $file ($(magick identify -format '%wx%h' "$file") spritesheet ${cols}x${rows})"
}

for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "skip: $file (not found)"
    continue
  fi

  if [[ -n "$SPRITESHEET" ]]; then
    process_spritesheet "$file"
  else
    local_dims=$(magick identify -format '%w %h' "$file")
    read -r w h <<< "$local_dims"
    if [[ $w -gt 128 || $h -gt 128 ]]; then
      echo "warn: $file is ${w}x${h} — if this is a spritesheet, use --spritesheet"
    fi
    process_single "$file"
  fi
done
