# Photo lettering study

Reference: `assets/reference/anniversary-frame.png`.

The inscription is a fine, informal connected hand with tall loops, long descenders, loose spacing and little heavy brush contrast. The upper line follows an arc. A photograph of physical printing cannot establish the exact font without its original design file.

Compared the actual phrase “Experience the world together” and the lower dedication in three candidate fonts, both straight and along a curve. The live comparison is `output/font-study.html`; rendered evidence is `output/playwright/font-comparison.png`.

| Candidate | Observation from the comparison |
| --- | --- |
| Sacramento | More compact, connected and curled; a more regular, decorative rhythm than the photo. |
| Allura | More formal with more thick/thin contrast and a stronger calligraphic slant. |
| Dawning of a New Day | Closest of these three in the open E, loose letter spacing, thin strokes and informal joins. Selected as an approximation. |

These are visual judgments, not a verified identification of the original font. The interface uses this font for English display text and dedication, preserving Chinese serif text where the reference has no Chinese equivalent. The title stays horizontal rather than copying the photograph's circular composition.

Primary sources:

- https://raw.githubusercontent.com/google/fonts/main/ofl/dawningofanewday/METADATA.pb
- https://github.com/googlefonts/dawningofanewday
- https://raw.githubusercontent.com/google/fonts/main/ofl/sacramento/DESCRIPTION.en_us.html
- https://raw.githubusercontent.com/google/fonts/main/ofl/allura/DESCRIPTION.en_us.html

Selected font is served locally at `public/fonts/DawningofaNewDay-Regular.ttf`; copyright and OFL license are retained in `public/fonts/Dawning-OFL.txt`. Candidate fonts and their licenses remain under `output/fonts/` for comparison.

## Legibility revision

After the user found the handwritten J in DJ unclear and the script too decorative, the interface prioritizes clear names over a closer script approximation. The current pair is LXGW WenKai (Chinese) and Baskervville (English). DJ & YW stays upright; only the English headline and anniversary dedication use the true italic. The Chinese has warm pen strokes without forcing Chinese characters into a Western script rhythm. These are design judgments, not an identification of the photographed font.

Fonts are served as local WOFF2 files (about 58 KB Chinese + 63 KB Latin), without external font requests. `scripts/prepare_fonts.py` subsets the source fonts in `output/fonts/` using current TypeScript/JSON interface copy. Rerun it after adding Chinese copy. The official LXGW license expressly permits web-only subset/WOFF2 conversion while keeping its reserved names. Both OFL licenses remain in `public/fonts/`.

Current primary sources:
- https://github.com/lxgw/LxgwWenKai
- https://github.com/anrt-type/ANRT-Baskervville
- https://raw.githubusercontent.com/google/fonts/main/ofl/baskervville/METADATA.pb

Rendered comparison in context: `output/playwright/fonts-final-zh.png` and `fonts-final-en.png`.

## Current direction: handwritten keepsake with clear names

The user found the all-serif English revision too conventional. Current display and anniversary lettering uses Sacramento, a semi-connected monoline script; upright Baskervville is retained only for unambiguous names and readable English controls/body. Chinese keeps LXGW WenKai. This brings back a handwritten dedication without returning to Dawning's ambiguous capital J. It remains an approximation, not a verified identification of the photograph's font.

Sacramento's official description: https://raw.githubusercontent.com/google/fonts/main/ofl/sacramento/DESCRIPTION.en_us.html . Its local WOFF2 is about 18 KB; source and license were retained from the previous candidate comparison. Current font payload is about 109 KB for three used faces, all local.

The stylesheet was consolidated into one hierarchy: body/actions 1rem, secondary 0.875rem, captions 0.75rem, dedication 1.5rem, Chinese display 2.5rem and English script display 3.25rem. Mobile display sizes are 2rem/2.75rem; body and action text stay 1rem. Names stay 1rem with modest tracking. Sizes account for the script's smaller x-height instead of forcing identical numerical sizes across languages.

Current renders: `keepsake-en.png`, `keepsake-zh.png`, `keepsake-mobile-en.png`, `keepsake-mobile-zh.png` under `output/playwright/`.

Latest requested refinement: DJ / YW now also use Sacramento, both in the dedication and on the workbench. The English title groups “world together” in a nonbreaking span. Browser inspection at 390px and 1440px confirmed one line for the phrase, matching script families for all name labels and no horizontal page overflow.
