# Baron Bacot — Website

**Live URL:** [www.baronbacot.com](https://www.baronbacot.com)  
**Hosted on:** [Vercel](https://vercel.com) (auto-deploys on every `git push`)  
**Repository:** [github.com/Momo9002/baronbacot](https://github.com/Momo9002/baronbacot)

---

## What this is

A custom-coded, static HTML website for **Baron Bacot Fine Art Interior Architecture** — a luxury interior design studio based in Dubai. The site targets UHNWI (Ultra-High-Net-Worth Individual) clients seeking bespoke residential, aviation, and superyacht commissions.

---

## File Structure

```
baronbacot/
├── index.html          # Main homepage (5 sections)
├── philosophy.html     # Philosophy sub-page (particle canvas + scroll)
├── css/
│   ├── styles.css      # Global stylesheet (all homepage styles)
│   └── philosophy.css  # Philosophy page specific styles
├── js/
│   ├── script.js       # Scroll animations, header behaviour
│   └── particles.js    # Three.js particle canvas for philosophy page
└── assets/
    ├── fonts/
    │   └── BaronBacot-Regular.ttf  # Custom brand typeface
    ├── logo_red_final.png           # Header logo (red & black)
    ├── white_logo.png               # White logo variant
    ├── sq_img_1.jpg                 # Hero section background
    ├── sq_img_2.jpg                 # Practice section background
    ├── sq_img_3.png                 # Statement section background
    ├── sq_img_4.jpg                 # Method section background
    ├── method_kitchen.jpg           # Used in method section (alt)
    └── practice_library.jpg         # Used in practice section (alt)
```

---

## Pages

### `index.html` — Homepage
Five full-viewport sections:
1. **Hero** — Background image + red strip blend effect + product card (Private Design Talk, $1,500)
2. **Statement** — "A Masterpiece Asset" — overlaid text on full-bleed image
3. **Practice** — 2×2 grid of services (Residential, Aviation, Maritime, Legacy)
4. **Method** — "A Life of Enchantment" — right-aligned text with Stripe CTA
5. **Access** — Solid red CTA section — "Obsessive Exclusivity"

### `philosophy.html` — Philosophy Page
- Full-screen black canvas with animated Three.js particles
- 4 scroll-triggered sections using GSAP + ScrollTrigger
- Sections: *Creating Private Worlds*, *Legacy Homes*, *Enduring Value*, *A Masterpiece Asset*

---

## Design System

| Token | Value |
|-------|-------|
| `--red` | `#950808` |
| `--black` | `#0a0a0a` |
| `--white` | `#ffffff` |
| `--font-ui` | Inter (Google Fonts) |
| `--font-body` | Quattrocento (Google Fonts) |
| `--font-motto` | Baron Bacot (custom TTF) |

**Key design techniques:**
- `mix-blend-mode: hard-light` on red strips for a "burnt-in" photographic overlay
- `backdrop-filter: blur()` glassmorphism on nav header and product card
- `.fade-in` + `IntersectionObserver` scroll animations
- Parallax via `background-attachment: fixed`

---

## Things to Complete

These placeholders exist in the code and need to be replaced when ready:

| Placeholder | File | What to replace with |
|-------------|------|----------------------|
| `YOUR_FUNNEL_LINK` | `index.html`, `philosophy.html` | Your Calendly or Typeform booking link |
| `https://buy.stripe.com/YOUR_STRIPE_LINK` | `index.html` (Method section) | Your real Stripe payment link |

---

## How to Update the Website

1. **Edit your files locally** (in this folder on your Mac via iCloud)
2. **Tell me to deploy**, and I'll run:
   ```bash
   git add .
   git commit -m "your update description"
   git push origin main
   ```
3. **Vercel auto-deploys** within ~10 seconds — your site is live ✅

---

## Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting + HTTPS + CDN (free) |
| **GitHub** (`Momo9002/baronbacot`) | Version control + auto-deploy trigger |
| **OVH** | Domain registrar for `baronbacot.com` (DNS only) |
| **ProtonMail** | Email (SPF + verification records on OVH DNS) |

**DNS setup on OVH:**
- `A` record: `baronbacot.com` → Vercel IP
- `CNAME` record: `www` → `cname.vercel-dns.com`
- `baronbacot.com` redirects automatically to `www.baronbacot.com`

---

## Previous Hosting (archived)

The previous website was on **Squarespace** (`baronbacot.com/commissions`). The old Squarespace DNS records were removed from OVH and replaced with Vercel records. A WordPress installation that was on the OVH FTP server has been renamed to `www_old_[timestamp]` and can be deleted from the OVH FTP panel if no longer needed.
