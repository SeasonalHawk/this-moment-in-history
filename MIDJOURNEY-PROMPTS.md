# Midjourney Image Generation Guide — Loading Carousel

## Quick Reference

| Spec | Value |
|------|-------|
| **Total images** | 11 |
| **Dimensions** | 768 x 432 (16:9) |
| **Format** | WebP or JPG |
| **Target size** | < 100KB each |
| **Save to** | `public/loading/` |

---

## Story Phase — Archive/Discovery Theme (5 images)

### 1. story-1.webp

**Message:** "Searching the archives..."

```
A dimly lit ancient archive room, towering wooden shelves filled with leather-bound books and scrolls, dust particles floating in golden lamplight, warm amber tones, cinematic wide shot --ar 16:9 --v 6.1
```

---

### 2. story-2.webp

**Message:** "Consulting the scrolls..."

```
An ornate reading desk with unfurled parchment scrolls, brass instruments and a magnifying glass, candlelight casting warm shadows, scholarly atmosphere, cinematic --ar 16:9 --v 6.1
```

---

### 3. story-3.webp

**Message:** "Dusting off the records..."

```
Hands carefully lifting a dusty leather journal from a wooden crate in a historical vault, motes of dust catching golden light, sepia and amber palette, cinematic --ar 16:9 --v 6.1
```

---

### 4. story-4.webp

**Message:** "Decoding an ancient manuscript..."

```
A mysterious illuminated manuscript on a stone desk, magnifying lens hovering over faded calligraphy, dramatic chiaroscuro lighting, warm gold and deep shadows, cinematic --ar 16:9 --v 6.1
```

---

### 5. story-5.webp

**Message:** "Opening the vault of forgotten stories..."

```
A massive stone vault door slowly opening, golden light streaming through the gap revealing shelves of ancient artifacts, dramatic perspective, warm amber glow, cinematic --ar 16:9 --v 6.1
```

---

## Audio Phase — Voyagers! Time-Travel Theme (6 images)

### 6. audio-1.webp

**Message:** "The Omni is locked on — engaging time coordinates..."

```
A futuristic handheld device with glowing dials and coordinates display, swirling temporal energy around it, teal and gold light effects, sci-fi adventure aesthetic, cinematic --ar 16:9 --v 6.1
```

---

### 7. audio-2.webp

**Message:** "Firing up the time machine..."

```
A brass and crystal time machine console powering up with crackling energy, spinning gears and glowing panels, steampunk meets sci-fi, warm amber and electric blue, cinematic --ar 16:9 --v 6.1
```

---

### 8. audio-3.webp

**Message:** "The pilot is charting a course through history..."

```
A navigator at a futuristic holographic star map showing historical timelines, constellations of dates and events floating in golden light, cinematic wide shot --ar 16:9 --v 6.1
```

---

### 9. audio-4.webp

**Message:** "Calibrating the temporal compass..."

```
An ornate steampunk compass with glowing temporal symbols instead of cardinal directions, energy arcs between brass arms, dramatic close-up, gold and teal glow, cinematic --ar 16:9 --v 6.1
```

---

### 10. audio-5.webp

**Message:** "Spinning up the portal — adventure awaits..."

```
A swirling time portal opening in an ancient stone archway, golden energy spiraling inward, a silhouette about to step through, dramatic lighting, cinematic --ar 16:9 --v 6.1
```

---

### 11. audio-6.webp

**Message:** "The green light is flashing — history needs us..."

```
A dramatic green signal light flashing on a futuristic command console, urgent atmosphere, reflections on polished surfaces, green and amber lighting, adventure-ready mood, cinematic --ar 16:9 --v 6.1
```

---

## After Generating

### Resize and optimize (ImageMagick example)

```bash
# Single file
convert input.png -resize 768x432 -quality 80 public/loading/story-1.webp

# Batch (if all PNGs are in a folder)
for f in story-*.png; do convert "$f" -resize 768x432 -quality 80 "public/loading/${f%.png}.webp"; done
for f in audio-*.png; do convert "$f" -resize 768x432 -quality 80 "public/loading/${f%.png}.webp"; done
```

### Final directory structure

```
public/loading/
├── story-1.webp
├── story-2.webp
├── story-3.webp
├── story-4.webp
├── story-5.webp
├── audio-1.webp
├── audio-2.webp
├── audio-3.webp
├── audio-4.webp
├── audio-5.webp
└── audio-6.webp
```

Once all 11 images are in `public/loading/`, let Claude know and the carousel code will be built.
