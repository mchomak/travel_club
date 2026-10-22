# Hero exploration assets

The original `TC_Logo_Editorial_Signature_Navy.svg` and
`TC_Logo_Editorial_Signature_Cream.svg` are kept here as the only copies; these
are the assets served by the site. The byte-identical root duplicates were
removed. No letterform, path or color changes. SVG viewBox: `0 0 452 215`.
Reference PNG previews are stored in
[`docs/design/references/brand/`](../../../docs/design/references/brand/).

Twenty local WebP photographs illustrate candidate destinations; they do not
announce TC tours. Individual source pages, photographers, download URLs,
licenses, dimensions, file sizes and modifications are recorded in
[`manifest.json`](manifest.json), verified 17 October 2026.

- China: Fu Shan Un, Pexels, Pexels License.
- Other nine: Unsplash, free Unsplash License; no Unsplash+ imagery.
- Images resized to a maximum long edge of 2560 px, preserving aspect ratio.
- Variants 11–20 show the complete landscape at its original aspect ratio;
  logo and tagline sit directly over the image. No cutouts or image crops are
  applied to those ten compositions. Variants 01–10 retain their original
  art-directed layouts and crops.
- No AI imagery or watermark removal. Photos are served locally through Next
  Image, not from third-party URLs. Only the selected variant is rendered.

Reproduce downloads from the repository root with
`python scripts/prepare_test9_photos.py` (Python, Pillow and requests).
Sources use the [Pexels License](https://www.pexels.com/license/) and
[Unsplash License](https://unsplash.com/license); source/author links for each
photo are in the manifest and the visual report.
