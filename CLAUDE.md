# CLAUDE.md — Ondrej Cervinka Portfolio

## Project overview
Static HTML/CSS/JS portfolio for Ondrej Cervinka — 3D artist & visual director based in Prague.
No build tools, no frameworks, no backend. Pure frontend only.

## File structure
```
portfolio/
├── index.html          — Home / Work listing (4 projects)
├── about.html          — About page
├── neva.html           — Project page: NEVA Zipscreen (architecture viz)
├── pantene.html        — Project page: Pantene Pro-V (beauty CGI)
├── loreal.html         — Project page: L'Oréal (product CGI)
├── rnd.html            — Project page: R&D / personal work
├── style.css           — Single shared stylesheet for all pages
├── branding/           — Logo (logo_withoutBG.png, logo_withoutBG_WHT.png), portrait (ondra_2.jpg)
├── portfolio-materials/ — All project images and videos
│   ├── NEVA/           — NEVA project images + WebM videos
│   ├── Pantene/        — Pantene project images + MP4 videos
│   └── LOREAL/         — L'Oréal project images
├── colorpalete/        — Color reference files
├── references/         — Reference assets
└── admin/              — PHP admin panel (IGNORE — not in scope)
```

## Design tokens (style.css :root)
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f7f6f3` | Page background (warm off-white) |
| `--ink` | `#111110` | Primary text, footer background |
| `--muted` | `#767370` | Secondary text, nav default |
| `--muted-label` | `#595856` | Labels, WCAG AA compliant |
| `--line` | `#d8d6d2` | Borders, dividers |
| `--font` | Inter, system-ui | Body / UI text |
| `--font-serif` | Noto Serif, Georgia | Headlines, descriptions |
| `--gap` | 24px | Grid gap |
| `--max` | 1240px | Max content width |
| `--pad` | 48px (→24px→20px) | Horizontal padding, responsive |

## Key CSS patterns
- **Scroll reveal**: `.reveal` class + IntersectionObserver → adds `.is-visible`
- **Custom cursor**: `.cursor` div, `mix-blend-mode: difference`, expands on hover of `.fig-img-wrap, a, button`
- **Lightbox**: `.lightbox` / `.lightbox.is-open`, triggered by non-project-link figure images. Adds `lightbox-open` class to `<body>` on open.
- **Image grids**: `.chapter-grid--full` (16/9), `.chapter-grid--two` (1fr 1fr), `.chapter-grid--three` (1fr 1fr 1fr) — grids are preserved on all screen sizes including mobile
- **Project link overlay**: `.fig-project-link` + `.fig-project-label` (hover reveals "View project →")
- **Sticky header**: `.header` + `.scrolled` class toggled on scroll > 10px
- **Video autoplay on scroll**: `IntersectionObserver` (threshold 0.4) on `.video-wrap` — plays on enter, pauses on leave. No `autoplay` attribute on video elements.
- **Video controls**: `.video-wrap` → `.video-toggle` (play/pause) + `.video-replay`. SVGs inside toggle must have class `.icon-pause` / `.icon-play`.

## Page structure (shared across all pages)
- `<div class="cursor">` — custom cursor dot
- `<header class="header">` — sticky, logo left / nav right
- `<main>` — page content
- `<footer class="footer-full">` — dark footer, links + copyright
- Inline `<script>` at bottom — scroll reveal + cursor + page-specific JS (no external JS files)

## Shared JS (inline, repeated per page)
1. Sticky header border on scroll
2. IntersectionObserver scroll reveal (`.fig, .chapter-head, .chapter-desc, .chapter-meta, .divider`)
3. Custom cursor with expand states
4. Lightbox (index.html + project pages)
5. Video scroll-autoplay via IntersectionObserver on `.video-wrap`

## Video implementation rules
- Never use `autoplay` attribute on `<video>` — autoplay is handled by JS IntersectionObserver
- All video wraps must have class `.video-wrap`
- Play/pause button must have class `.video-toggle`; Replay button must have class `.video-replay`
- SVG icons inside toggle: `.icon-pause` (visible by default) and `.icon-play` (hidden by default, `style="display:none"`)
- Loop gallery videos (`.fig-img-wrap video[loop]`) on neva.html open in lightbox on click

## Project page nav order (cycle)
NEVA → Pantene → L'Oréal → R&D → (back to NEVA)

## Responsive breakpoints
- `≤ 900px`: `--pad: 24px`, reduced chapter/hero padding
- `≤ 640px`: `--pad: 20px`, adjusted project layout — grids stay multi-column
- `≤ 380px`: about grid single column

## Known issues / pending fixes
- neva.html hero video: WebM only, no MP4 fallback (Safari compatibility)
- neva.html + pantene.html: loop gallery videos missing `poster` attribute
- neva.html, pantene.html, loreal.html, rnd.html: `aria-current="true"` on nav should be `aria-current="page"`
- loreal.html, rnd.html: hero `<img>` missing `width`/`height` attributes
- rnd.html project nav: skips L'Oréal in cycle (goes Pantene ← R&D → NEVA instead of L'Oréal ← R&D → NEVA)
- style.css mobile breakpoint: `.chapter-grid--full .fig video` missing `aspect-ratio: 4/3` rule

## Out of scope
- `admin/` — PHP admin panel, ignore entirely
- No build process, no package.json, no Node
