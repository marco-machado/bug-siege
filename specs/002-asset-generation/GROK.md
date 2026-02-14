# Grok Image Generation — Prompting Guide for Bug Siege Assets

## Current Model Landscape (Feb 2026)

- **Model name (API)**: `grok-imagine-image` (xAI's official API)
- **Underlying engine**: **Aurora** — an autoregressive mixture-of-experts network trained on interleaved text+image data
- **Access**: Free via [grok.com](https://grok.com), also available via [xAI API](https://docs.x.ai/docs/guides/image-generations)
- **Jan 2026 update**: xAI shipped a "revamped Image Generation" — the latest version as of now

## Key Capabilities

| Feature | Details |
|---------|---------|
| Prompt length | ~1,000 characters — use them all for precision |
| Aspect ratios | 1:1, 16:9, 9:16, 4:3, 3:4, 2:1, 1:2, and more |
| Batch | Up to 10 variations per request |
| Output | URL or base64 (downloads as PNG/JPG/WebP) |
| Image editing | Upload an image + text instruction to modify it |

## The Transparent Background Problem

**Grok does NOT natively output transparent PNGs.** The API docs have zero mention of alpha channels or transparency. This is consistent across all major AI image generators.

### Recommended Workflow: Solid Background → Background Removal

**Step 1 — Generate with a clean, uniform background:**

```
...on a solid bright green (#00FF00) background
...on a solid black background
...on a solid white background, studio lighting
```

Bright green (`#00FF00`) is ideal — chroma-key friendly, rarely appears in sci-fi art.

**Step 2 — Remove background programmatically:**

- **rembg** (Python CLI) — free, local, batch: `pip install rembg && rembg i input.png output.png`
- **[remove.bg](https://remove.bg)** — best automated tool, has API for batch
- **[Recraft Background Remover](https://www.recraft.ai/background-remover)** — free, AI-powered

## The Top-Down View Problem

**AI image generators rarely produce true top-down views.** Training data is overwhelmingly 3/4 perspective or side views, so even explicit "top-down" keywords get ignored. Community consensus across Grok, DALL-E, and Midjourney confirms this is a structural limitation, not a prompt issue.

### Workarounds (in order of reliability)

1. **"Flat lay photograph"** — strongest keyword; trained on product/food flat-lay photography which IS shot straight down
2. **"Overhead photograph"** — second best, triggers the straight-down camera association
3. **Describe what's visible from above** — instead of "top-down turret", say "only the top surface is visible, no sides"
4. **Lead with camera angle** — put the angle FIRST in the prompt so Grok frames the scene before rendering details
5. **Accept slight angle** — a slight overhead angle (like 70-80°) may be more achievable and still works for a top-down game

### Template with top-down fix

**Camera angle FIRST + Subject + Style + Technical Details + Background**

```
Flat lay overhead photograph of [entity description],
only the top surface visible, no side walls visible,
photorealistic sci-fi style, highly detailed, centered composition,
single subject, on a solid bright green background,
soft even studio lighting, no text, no watermark
```

## Asset Prompts

### Turrets

**Blaster:**
```
Flat lay overhead photograph of a futuristic single-barrel plasma cannon turret, only the top surface visible, no side walls visible, single barrel with a glowing blue energy core, angular gunmetal armor plating with subtle battle scorch marks, circular rotating base, photorealistic sci-fi rendering, highly detailed metallic surfaces, centered composition, single object, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, soft even studio lighting, no text, no watermark, no shadow, no ground plane
```

**Zapper:**
```
A futuristic tesla coil defense turret seen from directly above (top-down bird's-eye view), central lightning rod with crackling electric arcs, circular copper coil rings, glowing blue-white energy, angular metallic base, photorealistic sci-fi rendering, highly detailed, centered composition, single object, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, soft even studio lighting, no text, no watermark, no shadow, no ground plane
```

**Slowfield:**
```
A futuristic area-denial emitter turret seen from directly above (top-down bird's-eye view), dome-shaped cryo projector with frosty cyan glow, hexagonal vent panels radiating cold mist, sleek silver housing, photorealistic sci-fi rendering, highly detailed, centered composition, single object, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, soft even studio lighting, no text, no watermark, no shadow, no ground plane
```

**Wall:**
```
A heavy armored barricade block seen from directly above (top-down bird's-eye view), reinforced steel panels with rivets and welding seams, industrial military fortification, scratched and battle-worn surface, photorealistic sci-fi rendering, highly detailed, centered composition, single object, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, soft even studio lighting, no text, no watermark, no shadow, no ground plane
```

### Bugs

**Swarmer:**
```
An alien insect creature seen from directly above (top-down bird's-eye view), small fast-looking arthropod with sharp mandibles and thin segmented legs, chitinous exoskeleton with iridescent green-black sheen, bioluminescent markings, photorealistic sci-fi style, facing upward, centered composition, single creature, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, studio lighting, no text, no watermark, no shadow
```

**Brute:**
```
A massive armored alien beetle seen from directly above (top-down bird's-eye view), thick heavily plated carapace with horn-like protrusions, powerful crushing mandibles, dark crimson and obsidian exoskeleton, bioluminescent red veins, photorealistic sci-fi style, facing upward, centered composition, single creature, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, studio lighting, no text, no watermark, no shadow
```

**Spitter:**
```
An alien ranged insect seen from directly above (top-down bird's-eye view), elongated abdomen with visible acid sacs, needle-like proboscis for projectile attacks, mottled purple and toxic green coloring, bioluminescent warning patterns, photorealistic sci-fi style, facing upward, centered composition, single creature, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, studio lighting, no text, no watermark, no shadow
```

**Boss (Wave 10):**
```
A colossal alien queen insect seen from directly above (top-down bird's-eye view), massively armored carapace three times larger than normal bugs, crown of bony spikes, multiple glowing eyes, heavy crushing mandibles, dark metallic exoskeleton with pulsing bioluminescent red energy lines, photorealistic sci-fi style, facing upward, centered composition, single creature, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, studio lighting, no text, no watermark, no shadow
```

### Environment

**Background (no transparency needed):**
```
Seamless tileable texture of a futuristic military installation floor, dark metallic panels with subtle grid lines and dim ambient LED strips, industrial sci-fi aesthetic, photorealistic, top-down view, even flat lighting, no perspective distortion, square aspect ratio, seamlessly tileable pattern
```

**Grid Tile (no transparency needed):**
```
Seamless tileable texture of a single futuristic platform tile, brushed steel surface with recessed border lines and subtle corner bolts, faint holographic grid overlay, dark gunmetal color, photorealistic, top-down view, even flat lighting, no perspective distortion, square aspect ratio
```

### Projectiles

**Bullet (blaster):**
```
A small glowing plasma projectile seen from above (top-down view), bright orange-yellow energy bolt with trailing light, photorealistic sci-fi style, centered, single object, on a solid bright green (#00FF00) background, no shadow, no text
```

**Spitter bullet:**
```
A small glob of alien acid seen from above (top-down view), toxic green bioluminescent liquid droplet with sizzling edges, photorealistic sci-fi style, centered, single object, on a solid bright green (#00FF00) background, no shadow, no text
```

### Core

**Command Core:**
```
A futuristic military command center reactor core seen from directly above (top-down bird's-eye view), circular glowing blue energy core surrounded by concentric armored rings, holographic displays and blinking indicator lights, heavy fortified base, photorealistic sci-fi rendering, highly detailed, centered composition, single object, square 1:1 aspect ratio, on a solid bright green (#00FF00) background, soft even studio lighting, no text, no watermark, no shadow
```

## Prompting Best Practices

1. **Lead with camera angle** — "Flat lay overhead photograph of..." FIRST, before any subject details
2. **Be specific, not vague** — "single-barrel plasma cannon with glowing blue energy core" beats "a cool turret"
3. **Describe what's visible** — "only the top surface visible, no side walls visible" reinforces the angle
4. **"single subject, centered composition"** — prevents extra objects
5. **"no text, no watermark, no shadow, no ground plane"** — shadows on green backgrounds create removal artifacts
6. **Use 1:1 aspect ratio** for grid-cell entities, 16:9 for backgrounds
7. **Iterate one change at a time** — change only one thing per re-prompt
8. **"soft even studio lighting"** — prevents harsh shadows
9. **"photorealistic" + "sci-fi"** together give the HD alien-defense aesthetic

## What to Avoid

- "transparent background" in prompt — Grok renders a checkered pattern or glass effect
- Keyword stuffing — "beautiful, stunning, incredible, amazing" adds nothing
- Contradictory styles — "pixel art photorealistic" confuses the model
- Long text inside images — Grok handles short embedded text only

## Batch Workflow

```
1. Generate on grok.com with solid green background
2. Pick best variant from the 4 options
3. Remove background (rembg CLI or remove.bg)
4. Resize to target dimensions
5. Save as PNG to assets/{category}/
```
