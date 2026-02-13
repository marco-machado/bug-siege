# FLUX.2 Pro — Prompting Guide for Bug Siege Assets

## Model Overview

- **Model**: FLUX.2 [pro] by Black Forest Labs (Nov 2025)
- **Access**: [Replicate](https://replicate.com/black-forest-labs/flux-2-pro), [fal.ai](https://fal.ai/models/fal-ai/flux-2-pro), [Together AI](https://www.together.ai/models/flux-2-pro), or via [BFL API](https://docs.bfl.ml)
- **Pricing**: ~$0.03 per 1MP image
- **Output**: PNG (lossless) or JPEG — no native transparency/alpha
- **Max resolution**: 4MP output, dimensions must be multiples of 16

## Why FLUX.2 Pro for Game Assets

- **Top-down views actually work** — "photorealistic render" + "top-down view looking straight down" triggers precise CG camera angles
- **Photorealism** — pore-level skin, physically accurate lighting, realistic metal/glass/surfaces
- **Hex color support** — `solid #00ff00 background` works exactly as specified
- **Natural language prompting** — describe the image like you're explaining it to someone, not keyword soup
- **Zero config** — no guidance scale tuning, no special hacks needed

## Key Constraints

- **No negative prompts**: FLUX.2 does NOT understand "no X". The [official guide](https://docs.bfl.ml/guides/prompting_guide_flux2) says to describe what you WANT. Instead of "no shadows", say "flat even shadowless lighting". Instead of "no blur", say "sharp focus throughout".
- **Word order matters**: Put the most important elements FIRST — FLUX.2 prioritizes initial elements
- **Sweet spot is 30-80 words**: Short enough for coherence, long enough for detail
- **Subject + Style + Context**: The official recommended structure

## Proven Prompt Template

Based on the core asset that worked perfectly:

```
[description of object], photorealistic render, top-down view looking straight down,
flat even shadowless overhead lighting,
full [object type] visible with padding around edges, centered in frame,
[detailed physical description with materials and colors],
[surface detail: scratches, wear, grime, markings],
game building asset, solid #00ff00 background
```

### Anatomy of the Working Prompt

| Section | Purpose | Example |
|---------|---------|---------|
| Object description | What it is + style | "A glowing blue-white sci-fi energy reactor core" |
| Render style | Pushes photorealism | "photorealistic render" |
| Camera angle | Forces top-down | "top-down view looking straight down" |
| Lighting | Shadowless for clean bg removal | "flat even shadowless overhead lighting" |
| Framing | Prevents cropping | "full building visible with padding around edges, centered in frame" |
| Physical details | The actual design | "octagonal metallic base with a large cyan energy orb..." |
| Surface wear | Sells photorealism | "subtle scratches and wear on metal surfaces" |
| Asset context | Tells model this is a game piece | "game building asset" |
| Background | Clean chroma key | "solid #00ff00 background" |

## Asset Prompts

### Core (PROVEN — used this exact prompt)

> Note: This is the exact prompt that produced a perfect result. It contains "no shadows, no cast shadows" which technically violates the no-negative-prompts constraint — but it worked. All other prompts below use positive-only phrasing.

```
A glowing blue-white sci-fi energy reactor core, photorealistic render, top-down view looking straight down, flat even overhead lighting, no shadows, no cast shadows, full building visible with padding around edges, centered in frame, octagonal metallic base with a large cyan energy orb floating in the center, dark gunmetal plating with riveted panels, ventilation grates, and faded warning markings, cyan light emanating from the center orb illuminating surrounding metal plates with soft caustic reflections, subtle scratches and wear on metal surfaces, game building asset, solid #00ff00 background
```

### Blaster (original, single-piece — replaced by base + barrel)

```
A sci-fi plasma cannon turret, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full turret visible with padding around edges, centered in frame, circular armored base with a single cannon barrel extending toward the top of the image, glowing blue energy core where barrel meets base, dark gunmetal plating with angular armor panels and riveted seams, barrel has a bright blue plasma muzzle tip, subtle battle scorch marks and scratches on metal surfaces, game building asset, solid #00ff00 background
```

### Blaster Base (static platform, no barrel)

```
A sci-fi turret base platform without any barrel or cannon, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full base visible with padding around edges, centered in frame, circular armored platform with a central mounting ring where a barrel would attach, glowing blue energy core in the center, dark gunmetal plating with angular armor panels and riveted seams, battle scorch marks and scratches on metal surfaces, game building asset, solid #00ff00 background
```

### Blaster Barrel (rotating cannon, no base)

```
A sci-fi plasma cannon barrel without a base, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full barrel visible with padding around edges, centered in frame, single elongated cannon barrel pointing upward in frame, mounting socket at bottom end, bright blue plasma muzzle tip at top end, dark gunmetal with angular paneling and energy conduits running along the barrel, subtle battle wear and scratches, game weapon component asset, solid #00ff00 background
```

### Zapper

```
A sci-fi tesla coil lightning turret, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full turret visible with padding around edges, centered in frame, circular base with a central lightning rod surrounded by copper coil rings, crackling blue-white electric arcs between the coils, dark gunmetal housing with ventilation slits and warning markings, glowing energy capacitors on the base ring, subtle scratches and oxidation on metal surfaces, game building asset, solid #00ff00 background
```

### Slowfield

```
A sci-fi cryo emitter area-denial turret, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full turret visible with padding around edges, centered in frame, circular base with a dome-shaped frost projector in the center, hexagonal cryo vent panels radiating outward, frosty cyan glow emanating from the dome, sleek silver and dark gunmetal plating with condensation frost on surfaces, subtle ice crystal formations on outer panels, game building asset, solid #00ff00 background
```

### Wall

```
A heavy sci-fi armored barricade block, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full block visible with padding around edges, centered in frame, square reinforced steel block with thick riveted armor plates, welding seams, industrial bolt patterns, yellow-black hazard stripe on one edge, dark gunmetal with heavy battle damage scratches and dents, game building asset, solid #00ff00 background
```

### Swarmer Bug

```
An alien insect creature, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full creature visible with padding around edges, centered in frame, small fast-looking arthropod with sharp mandibles and thin segmented legs splayed outward, chitinous exoskeleton with iridescent green-black sheen, bioluminescent teal markings along spine, body facing upward in frame, game creature asset, solid #00ff00 background
```

### Brute Bug

```
A massive armored alien beetle, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full creature visible with padding around edges, centered in frame, heavily plated carapace with horn-like protrusions, powerful crushing mandibles, dark crimson and obsidian exoskeleton, bioluminescent red veins pulsing across armor plates, body facing upward in frame, game creature asset, solid #00ff00 background
```

### Spitter Bug

```
An alien ranged insect with acid sacs, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full creature visible with padding around edges, centered in frame, elongated abdomen with translucent acid sacs glowing toxic green, needle-like proboscis extending forward, mottled purple and green exoskeleton, bioluminescent warning patterns on carapace, body facing upward in frame, game creature asset, solid #00ff00 background
```

### Boss Bug (Wave 10)

```
A colossal alien queen insect, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, full creature visible with padding around edges, centered in frame, massively armored carapace with crown of bony spikes, multiple glowing red eyes, heavy crushing mandibles, dark metallic exoskeleton with pulsing bioluminescent red energy lines across all plates, body facing upward in frame, twice the visual size of a normal bug, game creature asset, solid #00ff00 background
```

### Bullet (Blaster Projectile)

```
A small glowing plasma energy bolt, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, centered in frame, bright orange-yellow energy projectile with trailing plasma wisps, game projectile asset, solid #00ff00 background
```

### Spitter Bullet

```
A small glob of alien acid, photorealistic render, top-down view looking straight down, flat even shadowless overhead lighting, centered in frame, toxic green bioluminescent liquid droplet with sizzling caustic edges, game projectile asset, solid #00ff00 background
```

### Background (no transparency needed)

```
Seamless tileable texture of a futuristic military installation floor, photorealistic render, top-down view looking straight down, flat even overhead lighting, dark metallic panels with subtle grid line seams and dim ambient blue LED strips between panels, industrial sci-fi aesthetic, square aspect ratio, seamlessly tileable pattern
```

### Grid Tile (no transparency needed)

```
Seamless tileable texture of a single futuristic platform tile, photorealistic render, top-down view looking straight down, flat even overhead lighting, brushed steel surface with recessed border grooves and small corner bolts, faint holographic grid overlay, dark gunmetal color, square aspect ratio, seamlessly tileable
```

## Top-Down View: Why It Works

1. **"photorealistic render"** — triggers CG/3D render training data where camera angles are precise
2. **"top-down view looking straight down"** — redundant reinforcement works
3. **"flat even overhead lighting"** — implies the camera IS the light source (directly above)
4. **"game building asset"** — triggers game asset training data which includes top-down sprites

For **asymmetric objects** (turrets with barrels, directional bugs): describe which direction the asymmetric part points ("barrel extending toward the top of the image", "body facing upward in frame").

## Background Removal Workflow

FLUX.2 does not output transparency natively.

```
1. Generate with solid #00ff00 background
2. Remove background: rembg i input.png output.png
3. Resize to target dimensions
4. Save to assets/{category}/
```

## Advanced: JSON Structured Prompting

For maximum control over complex scenes, FLUX.2 supports JSON input:

```json
{
  "scene": "sci-fi turret game asset on green background",
  "subjects": [
    {
      "description": "plasma cannon turret with single barrel",
      "position": "centered in frame",
      "color_palette": ["#2a2a2a", "#00aaff", "#444444"]
    }
  ],
  "style": "photorealistic 3D render",
  "lighting": "flat even shadowless overhead",
  "camera": {
    "angle": "top-down, looking straight down",
    "lens": "orthographic",
    "depth_of_field": "infinite, everything in focus"
  }
}
```

## Sources

- [FLUX.2 Official Prompting Guide (BFL)](https://docs.bfl.ml/guides/prompting_guide_flux2)
- [FLUX.2 Pro on fal.ai](https://fal.ai/models/fal-ai/flux-2-pro)
- [FLUX.2 Pro on Replicate](https://replicate.com/black-forest-labs/flux-2-pro)
- [FLUX.2 Complete Guide 2026 (WaveSpeedAI)](https://wavespeed.ai/blog/posts/flux-2-complete-guide-2026/)
- [FLUX.2 Pro: Pinnacle of AI Image Gen (Republic Labs)](https://blog.republiclabs.ai/2026/01/flux-2-pro-pinnacle-of-ai-image.html)
- [Mastering FLUX.2 Prompting (Atlabs)](https://www.atlabs.ai/blog/flux-2-prompting-guide)
