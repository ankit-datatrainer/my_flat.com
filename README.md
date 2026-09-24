# Flat 702

Animated, responsive property website for 702, Gali No. 9, First Floor, West Vinod Nagar, Mandawali, Delhi 110092.

Rent: ₹7,500/month. Advance: one month's rent. No fixed security deposit. Contact: +91 78383 49247 (call or WhatsApp).

## What's on the page

1. **Preloader**: counts up while the hero photos load, then a curtain wipe reveals the site.
2. **3D hero (WebGL / Three.js)**: eight real photos on a ring of curved panels with reflections, floating dust and a mouse-parallax camera. Scrolling flies the camera down into the ring, rotates the rooms past you, then pushes the panels outward into "Six spaces. One address." Scroll speed bends the panels and splits their colour channels.
3. **Ticker**: an endless marquee of key facts whose speed and direction follow your scrolling.
4. **Essentials**: fact cards flip up in 3D, with a counting rent figure and pointer-tracked tilt and glow.
5. **3D walkthrough**: a pinned corridor of six chapters. Photos fly past in depth, the copy swaps per chapter, the background tint follows each room's colour, and chapter buttons jump straight to a room.
6. **Details strip**: vertical scroll drives a horizontal, curved 3D photo strip with parallax and velocity skew.
7. **Gallery**: 20 photos with clip-path reveals, animated filters, an originals toggle and a full-screen viewer (keyboard and swipe).
8. **Before/after**: drag a slider between the AI-cleaned preview and the original photo. Six photos are available.
9. **Location**: an illustrated map draws itself, the pin drops in, and the PIN code rolls in.
10. **Enquire**: WhatsApp and one-tap Quick Call, plus a tilting rent card. A sticky Call/WhatsApp dock appears on phones.

Other touches: Lenis smooth scrolling, a custom cursor and magnetic buttons (mouse only), word-by-word headline reveals, a film-grain overlay, a scroll progress bar and a header that hides on scroll.

Fonts: Bricolage Grotesque (display/UI) and Instrument Serif (italic accents).

## Accessibility and motion

The site respects the operating system's reduced-motion setting, and the walkthrough has a "Motion on/off" toggle. In calm mode, smooth scrolling, the scroll-driven 3D and the reveal animations are switched off. If WebGL is unavailable, a static photo layout replaces the hero. The photo viewer is a native `<dialog>`, and the tour, strip and gallery items can be reached with the keyboard.

## Structure

```
dist/
  index.html
  css/site.css
  js/site.js       # GSAP/ScrollTrigger choreography, gallery, viewer, compare, FAQ
  js/hero3d.js     # Three.js hero scene (ES module)
  vendor/          # three r169, gsap 3.12.5 + ScrollTrigger, lenis 1.1.13 (vendored, no CDN dependency)
  assets/          # 20 photos × (cleaned, -original, -thumb) WebP
```

## Preview

```
node server.mjs
```

Then open http://127.0.0.1:4173. Run `node verify.mjs` to check links, assets, rent and contact details.

## Deploy on Vercel

Import the GitHub repository into Vercel with the repository root as the project root. `vercel.json` sets `dist` as the output directory, uses no framework and no build step, and adds cache headers for photos and libraries. Pushes to `main` deploy automatically once the project is connected.

## Honesty notes

The walkthrough and hero present real photographs in 3D space. They are not a measured reconstruction or a 360° scan. Cleaned previews are AI-retouched and labelled as such, and the originals are always available. Room count, floor area, utilities and availability are not stated on the site because they haven't been confirmed.
