#!/usr/bin/env bash
#
# Generate a game asset using the xAI Grok Imagine API.
#
# Usage:
#   XAI_API_KEY=your_key ./scripts/generate-asset.sh
#
# The script generates the Command Core sprite as a test asset.

set -euo pipefail

API_KEY="${XAI_API_KEY:?Set XAI_API_KEY environment variable}"
OUTPUT_DIR="assets/sprites"
OUTPUT_FILE="$OUTPUT_DIR/core.png"

PROMPT='Top-down view of a sci-fi command core structure for a 2D tower defense game. A glowing blue-white energy reactor housed in a metallic hexagonal chassis with pulsing cyan conduits. Clean digital art style, flat lighting from above, dark metallic background. Game asset sprite, 64x64 pixel dimensions, centered composition, no shadows on the ground. Inspired by StarCraft and Factorio building aesthetics.'

echo "Generating: Command Core sprite"
echo "Prompt: $PROMPT"
echo ""

RESPONSE=$(curl -s -X POST "https://api.x.ai/v1/images/generations" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg prompt "$PROMPT" \
    '{
      model: "grok-imagine-image",
      prompt: $prompt,
      n: 1,
      response_format: "b64_json"
    }')")

ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')
if [[ -n "$ERROR" ]]; then
  echo "API Error: $ERROR"
  echo "Full response:"
  echo "$RESPONSE" | jq .
  exit 1
fi

REVISED_PROMPT=$(echo "$RESPONSE" | jq -r '.data[0].revised_prompt // "none"')
echo "Revised prompt: $REVISED_PROMPT"
echo ""

B64_DATA=$(echo "$RESPONSE" | jq -r '.data[0].b64_json')

if [[ "$B64_DATA" == "null" || -z "$B64_DATA" ]]; then
  echo "No image data in response."
  echo "Full response:"
  echo "$RESPONSE" | jq .
  exit 1
fi

CLEAN_B64=$(echo "$B64_DATA" | sed 's|^data:image/[^;]*;base64,||')

echo "$CLEAN_B64" | base64 -d > "$OUTPUT_FILE"
echo "Saved to $OUTPUT_FILE"
echo "File size: $(wc -c < "$OUTPUT_FILE") bytes"
file "$OUTPUT_FILE"
