# Flat 702

Responsive static property website for 702, Gali No. 9, First Floor, West Vinod Nagar, Mandawali, Delhi 110092.

Rent: ₹7,500/month. Advance: one month's rent. No fixed security deposit. Contact: +91 78383 49247.

## Preview

Run `node server.mjs` from this folder and open http://127.0.0.1:4173.

## Deploy on Vercel

Import the GitHub repository into Vercel with the repository root as the project root. `vercel.json` selects `dist` as the output directory and no framework. No build command, environment variables, or install step is needed. The 60 optimized WebP assets are committed with the site. Once imported, pushes to the production branch can deploy automatically.

## Website

Deploy the contents of `dist`. No build is needed. The site includes a CSS 3D scroll walkthrough, 20-photo gallery, original/cleaned comparison, accessible photo dialog, WhatsApp and phone links, and a Google Maps address search.

The walkthrough is a photographic presentation in 3D space, not a measured reconstruction or 360-degree scan. The AI-retouched photographs are labeled on the site, and all originals are available for comparison. Room count, floor area, utilities and availability have not been confirmed and are not invented.

The photos are compressed WebP derivatives of the originals and cleaned previews in the parent workspace. `prepare-assets.cjs` recreates the image derivatives on this workstation using its bundled Sharp library. The deployed site does not depend on that script or library.

Run `node --check dist/app.js` and `node verify.mjs` for source and asset checks.

Motion follows the operating system preference and can also be disabled in the walkthrough. Mobile users can navigate chapter buttons and swipe images in the photo viewer. Contact buttons launch the user's dialer or WhatsApp; they do not automatically send a message or initiate a call.

## Scroll hero and responsive layout

The hero now uses a sticky viewport and native scroll progress to position four photo planes in 3D. There is no autoplay timer or focus-dependent animation. Previous/next controls scroll to each photograph; the motion toggle is shared with the walkthrough. `hero.js` drives the presentation and `responsive.css` contains the responsive refinements.

Verified at 320, 390, 768, 1024 and 1440 pixel viewport widths: no horizontal page or content-section overflow. Browser checks covered real-scroll transform changes, reduced-motion fallback, tablet gallery filtering and original-photo comparison, and phone/WhatsApp link destinations. This is local browser verification, not testing on physical devices.
