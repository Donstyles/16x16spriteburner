// ===================== the heroes' heads, cut off by hand (the Head Cut Painter) =====================
// Per hero, per frame (0-3): m, which pixels of the frame (weapon already cut away) are the head (256 bytes, base64, row
// by row from the top left, 1 = head); p, the body redrawn where the neck is cut (1024 bytes RGBA, base64: alpha 0 the
// pixel as it was, 1 the pixel cleared, above that the pixel painted that colour: the stump). A frame left null is cut
// by the game itself (48_deaths autoHead). Written by tools/heads.js from the painter's saved frames; not edited by hand.
const HEAD_CUTS_RAW = {};
const HEAD_CUTS = {}; for (const k in HEAD_CUTS_RAW) HEAD_CUTS[k] = HEAD_CUTS_RAW[k].map(d => d && { mask: b64u8(d.m), paint: b64u8(d.p) });
