# Nano Fat STEP Export Summary

Generated: 2026-04-17T15:33:19.246Z

## OpenCascade.js State

- package.json dependency: ^1.1.1
- package-lock version: 1.1.1
- runtime path: opencascade.js/dist/opencascade.wasm.js via Vite browser dynamic import

## Generated Results

### Nano Transfer Corpo

- STEP: nano fat/outputs/step/nano-transfer-outer.step
- 2D SVG: nano fat/outputs/svg/nano-transfer-outer.svg
- A3 SVG: nano fat/outputs/svg/nano-transfer-outer-a3.svg
- STEP verification: header=true, footer=true, bytes=66902, entities=1430
- Shape summary: {"segmentShapeCount":6,"boreCutCount":11}
- Blocking reasons: none

### Nano Transfer Tampa

- STEP: nano fat/outputs/step/nano-transfer-cap.step
- 2D SVG: nano fat/outputs/svg/nano-transfer-cap.svg
- A3 SVG: nano fat/outputs/svg/nano-transfer-cap-a3.svg
- STEP verification: header=true, footer=true, bytes=37644, entities=815
- Shape summary: {"segmentShapeCount":3,"boreCutCount":6}
- Blocking reasons: none

### Hexágono M12

- STEP: nano fat/outputs/step/regression-hexagono-m12.step
- 2D SVG: nano fat/outputs/svg/regression-hexagono-m12.svg
- A3 SVG: [not generated]
- STEP verification: header=true, footer=true, bytes=62630, entities=1335
- Shape summary: {"segmentShapeCount":5,"boreCutCount":1}
- Blocking reasons: none

## Modeling Notes

- The Nano Transfer body resolves the source discrepancy by making the final lip 1.40 mm so segment lengths add to the 39.50 mm total shown on page 1.
- Current V1 STEP export models axisymmetric solids, tapers, straight prism zones, and axial bore cuts. It does not model exact knurl texture, helical thread geometry, luer-lock double-start geometry, or mesh/screen perforation detail.
- The Hexagono M12 regression export was generated from the existing fixture to verify that the multiple-prism 3D/STEP path remains open.

Overall STEP header/footer verification: PASS
