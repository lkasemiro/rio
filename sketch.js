// Rio satélite suave + final “vira mar” + zoom out (20s total)
// p5.js

// -------------------- TEMPO --------------------
const FPS = 60;
const TOTAL_SECONDS = 20;
const ZOOM_SECONDS  = 5;     // parte final do zoom out
const FLOOD_SECONDS = 2.5;   // tempo do “rio vira mar” antes do zoom

// -------------------- MUNDO --------------------
let worldH = 9000;
let camY = 0;
let speed = 1.0;

let mode = "journey"; // "journey" | "zoomout"
let zoomStartFrame = 0;
let zoomDuration = ZOOM_SECONDS * FPS;

// “flood” (tela vira água)
let floodStartFrame = 0;
let floodDuration = FLOOD_SECONDS * FPS;

// -------------------- TEXTURAS --------------------
let landTex;
let mapG;
let deltaNet;

// -------------------- ÁGUA (partículas) --------------------
let particles = [];
const N_PART = 520; // menos partículas, mais suave

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  zoomDuration = ZOOM_SECONDS * FPS;
  floodDuration = FLOOD_SECONDS * FPS;

  // viagem ocupa TOTAL - ZOOM - FLOOD
  const travelFrames = max(1, (TOTAL_SECONDS - ZOOM_SECONDS - FLOOD_SECONDS) * FPS);
  speed = (worldH - height) / travelFrames;

  landTex = makeSatelliteLandTile(900, 700, 42);

  for (let i = 0; i < N_PART; i++) particles.push(spawnParticle());

  buildDeltaMap();
}

function draw() {
  const t = frameCount * 0.01;

  if (mode === "journey") {
    camY += speed;

    // quando chega no final do mundo, entra no flood
    if (camY >= worldH - height) {
      camY = worldH - height;
      mode = "flood";
      floodStartFrame = frameCount;
    }

    drawSatelliteBackground(t);
    drawRiver(camY, t, 0);
    updateParticles(camY, t, 0);
    drawAtmosHaze(camY, t);

  } else if (mode === "flood") {
    // progresso do flood 0..1
    const u = constrain((frameCount - floodStartFrame) / floodDuration, 0, 1);
    const e = easeInOutCubic(u);

    drawSatelliteBackground(t);

    // desenha o rio com “engrossamento” progressivo até preencher a tela
    drawRiver(camY, t, e);
    updateParticles(camY, t, e);

    // “tela azul” — camada de água por cima (quando e->1 fica toda azul)
    noStroke();
    fill(40, 95, 140, 200 * e);
    rect(0, 0, width, height);

    // brilho do mar (bem sutil)
    stroke(255, 255, 255, 10 * e);
    strokeWeight(1);
    for (let i = 0; i < 10; i++) {
      const yy = height * (0.30 + i * 0.06);
      beginShape();
      for (let x = 0; x <= width; x += 18) {
        vertex(x, yy + sin(x * 0.02 + t * 2 + i) * 5);
      }
      endShape();
    }

    if (u >= 1) {
      mode = "zoomout";
      zoomStartFrame = frameCount;
    }

  } else {
    drawFinalZoomOut();
  }
}

// ============================================================
// FUNDO SATÉLITE
// ============================================================
function drawSatelliteBackground(t) {
  for (let y = 0; y < height; y += landTex.height) {
    for (let x = 0; x < width; x += landTex.width) {
      image(landTex, x, y);
    }
  }

  // leve variação vertical por zona (bem suave)
  noStroke();
  for (let y = 0; y < height; y += 8) {
    const worldY = camY + y;
    const zone = zoneAt(worldY);

    let ov;
    if (zone === "spring") ov = color(215, 225, 235, 10);
    else if (zone === "forest") ov = color(35, 90, 55, 8);
    else if (zone === "plain") ov = color(80, 100, 65, 6);
    else if (zone === "estuary") ov = color(50, 105, 75, 8);
    else ov = color(40, 80, 130, 10);

    fill(ov);
    rect(0, y, width, 8);
  }
}

function makeSatelliteLandTile(w, h, seed) {
  randomSeed(seed);
  noiseSeed(seed);

  const g = createGraphics(w, h);
  g.pixelDensity(1);

  // base mais verde (você pediu)
  g.background(24, 46, 30);

  g.noStroke();
  for (let i = 0; i < 1400; i++) {
    const x = random(w), y = random(h);
    const n = noise(x * 0.008, y * 0.008);

    // paleta mais “mata” (verde mais forte)
    const c1 = color(14, 40, 22, 42);
    const c2 = color(20, 58, 30, 42);
    const c3 = color(38, 78, 40, 38);
    const c4 = color(70, 110, 58, 30);

    let c;
    if (n < 0.33) c = lerpColor(c1, c2, n / 0.33);
    else if (n < 0.66) c = lerpColor(c2, c3, (n - 0.33) / 0.33);
    else c = lerpColor(c3, c4, (n - 0.66) / 0.34);

    g.fill(c);
    g.ellipse(x, y, random(10, 60), random(10, 55));
  }

  // clareiras/solo
  for (let i = 0; i < 180; i++) {
    g.fill(85, 78, 58, random(8, 18));
    g.ellipse(random(w), random(h), random(30, 160), random(20, 110));
  }

  // sombras de copa
  for (let i = 0; i < 300; i++) {
    g.fill(0, 0, 0, random(8, 16));
    g.ellipse(random(w), random(h), random(40, 220), random(30, 150));
  }

  // granulação
  g.stroke(10, 14, 12, 16);
  for (let i = 0; i < 11000; i++) g.point(random(w), random(h));

  return g;
}

// ============================================================
// RIO (com “flood” opcional)
// floodK: 0..1 (0 normal; 1 vira mar)
// ============================================================
function drawRiver(camY, t, floodK) {
  const step = 14;
  let L = [], R = [];

  for (let sy = -step; sy <= height + step; sy += step) {
    const worldY = camY + sy;
    const e = riverEdges(worldY, t, floodK);
    L.push({ x: e.left, y: sy });
    R.push({ x: e.right, y: sy });
  }

  const zone = zoneAt(camY + height * 0.5);

  // água mais “verde” no rio, mais azul quando vira mar
  let water = color(65, 170, 135, 195); // mais verde
  if (zone === "spring")  water = color(75, 185, 155, 195);
  if (zone === "forest")  water = color(60, 160, 125, 200);
  if (zone === "plain")   water = color(62, 165, 132, 200);
  if (zone === "estuary") water = color(68, 175, 150, 205);
  if (zone === "ocean")   water = color(55, 120, 160, 210);

  // durante flood, puxar para azul-mar
  const sea = color(40, 95, 140, 220);
  water = lerpColor(water, sea, floodK);

  noStroke();
  fill(water);
  beginShape();
  for (const p of L) vertex(p.x, p.y);
  for (let i = R.length - 1; i >= 0; i--) vertex(R[i].x, R[i].y);
  endShape(CLOSE);

  // textura interna suave
  stroke(245, 255, 255, 22);
  strokeWeight(1);
  const lines = 8;
  for (let k = 0; k < lines; k++) {
    beginShape();
    for (let sy = 0; sy <= height; sy += step) {
      const worldY = camY + sy;
      const e = riverEdges(worldY, t, floodK);
      const u = (k + 1) / (lines + 1);
      let x = lerp(e.cx - e.hw, e.cx + e.hw, u);
      x += map(noise(k * 9, worldY * 0.01, t), 0, 1, -10, 10) * (1 - 0.4 * floodK);
      curveVertex(x, sy);
    }
    endShape();
  }
}

// ============================================================
// PARTÍCULAS — fluxo mais lento (você pediu)
// floodK reduz ainda mais (quando vira mar)
// ============================================================
function spawnParticle() {
  return {
    x: random(width),
    y: random(height),
    // bem mais lento que antes
    speed: random(0.35, 0.85),
    size: random(1.0, 1.8),
    life: random(120, 320)
  };
}

function updateParticles(camY, t, floodK) {
  for (const p of particles) {
    const worldY = camY + p.y;
    const e = riverEdges(worldY, t, floodK);

    // fluxo mais calmo
    let vx = map(noise(p.x * 0.003, worldY * 0.004, t), 0, 1, -0.45, 0.45);
    let vy = map(noise(500 + p.x * 0.002, worldY * 0.003, t), 0, 1, 0.55, 1.05);

    // ainda puxa para o centro
    vx += (e.cx - p.x) * 0.0018;

    // durante flood, deixa bem leve (mar “parado”)
    const calm = (1 - 0.75 * floodK);

    p.x += vx * p.speed * calm;
    p.y += vy * p.speed * calm;

    if (p.x < e.left + 6 || p.x > e.right - 6) {
      p.x = lerp(e.left + 10, e.right - 10, random());
    }

    stroke(245, 255, 255, 38 * calm);
    strokeWeight(p.size);
    point(p.x, p.y);

    p.life -= 1;
    if (p.y > height + 50 || p.life <= 0) {
      p.y = random(-90, -10);
      p.x = random(width);
      p.life = random(140, 360);
    }
  }
}

// ============================================================
// ATMOSFERA
// ============================================================
function drawAtmosHaze(camY, t) {
  const zMid = z01(camY + height * 0.5);

  let strength = 0.0;
  if (zMid < 0.22) strength = lerp(0.50, 0.15, smoothstep(0.02, 0.22, zMid));
  if (zMid > 0.75) strength = max(strength, lerp(0.10, 0.25, smoothstep(0.75, 1.0, zMid)));

  noStroke();
  for (let i = 0; i < 7; i++) {
    const yy = (i / 7) * height;
    const a = 18 * strength;
    fill(220, 240, 255, a);
    ellipse(width * 0.5, yy, width * 1.2, height * 0.20);
  }
}

// ============================================================
// ZOOM OUT FINAL: começa “mar” e revela que era rio/delta
// - menos ramificações
// - rio mais verde
// ============================================================
function drawFinalZoomOut() {
  const u = constrain((frameCount - zoomStartFrame) / zoomDuration, 0, 1);
  const e = easeInOutCubic(u);

  // primeiro: tela “mar”
  background(35, 90, 140);

  // ondas leves no mar (só pra dar vida enquanto revela)
  stroke(255, 255, 255, 10 * (1 - e));
  strokeWeight(1);
  for (let i = 0; i < 9; i++) {
    const yy = height * (0.25 + i * 0.07);
    beginShape();
    for (let x = 0; x <= width; x += 18) vertex(x, yy + sin(x * 0.02 + frameCount * 0.05 + i) * 5);
    endShape();
  }

  // imagem do mapa vai aparecendo e afastando (zoom out)
  const s = lerp(1.45, 0.90, e);
  const dx = (noise(frameCount * 0.01) - 0.5) * 14 * (1 - e);
  const dy = (noise(999 + frameCount * 0.01) - 0.5) * 14 * (1 - e);

  push();
  translate(width / 2 + dx, height / 2 + dy);
  scale(s);
  translate(-mapG.width / 2, -mapG.height / 2);

  // fade-in do mapa
  tint(255, 255 * e);
  image(mapG, 0, 0);
  noTint();

  pop();

  // legenda
  noStroke();
  fill(240, 250, 245, 170 * e);
  textAlign(LEFT, BOTTOM);
  textSize(14);
  text("Zoom out — era a foz de um rio", 16, height - 16);
}

function buildDeltaMap() {
  const mw = 1200, mh = 800;
  mapG = createGraphics(mw, mh);
  mapG.pixelDensity(1);

  // MENOS ramificações (você pediu)
  deltaNet = generateDeltaNetwork(mw, mh, 1234, 32);

  renderDeltaMap();
}

function generateDeltaNetwork(mw, mh, seed, branchCount) {
  randomSeed(seed);
  noiseSeed(seed);

  const polylines = [];

  // canal principal
  const main = [];
  let x = mw * 0.58;
  let y = mh * 0.10;
  let ang = PI / 2 + random(-0.10, 0.10);

  const steps = 240;
  for (let i = 0; i < steps; i++) {
    main.push({ x, y });

    const n = noise(i * 0.06, seed * 0.01);
    ang += map(n, 0, 1, -0.05, 0.05);

    const t = i / steps;
    const sp = lerp(3.0, 4.2, t);
    x += cos(ang) * sp;
    y += sin(ang) * sp;

    // abre levemente o leque
    if (t > 0.65) x += random(-0.6, 0.6);

    x = constrain(x, 70, mw - 70);
    y = constrain(y, 60, mh - 60);
  }
  polylines.push({ pts: main, w: 30 });

  // ramificações
  for (let b = 0; b < branchCount; b++) {
    const idx = floor(random(110, steps - 14));
    const p0 = main[idx];
    const p1 = main[min(idx + 1, main.length - 1)];
    const dir = atan2(p1.y - p0.y, p1.x - p0.x);

    const sign = random() < 0.5 ? -1 : 1;
    let a = dir + sign * random(0.40, 1.05);

    let bx = p0.x + random(-8, 8);
    let by = p0.y + random(-8, 8);

    const len = floor(random(70, 170));
    const pts = [];
    for (let i = 0; i < len; i++) {
      pts.push({ x: bx, y: by });

      const nn = noise(500 + b * 10, i * 0.05);
      a += map(nn, 0, 1, -0.07, 0.07);

      const tt = i / len;
      const sp = lerp(2.2, 3.6, tt);
      bx += cos(a) * sp;
      by += sin(a) * sp;

      by += 0.30; // puxa pro “mar”

      if (bx < 35 || bx > mw - 35 || by < 35 || by > mh - 35) break;
    }

    const w = random(7, 14);
    polylines.push({ pts, w });
  }

  return polylines;
}

function renderDeltaMap() {
  const g = mapG;

  // fundo “terra satélite” (mais verde)
  const tile = makeSatelliteLandTile(600, 450, 99);
  g.background(20, 40, 30);
  for (let y = 0; y < g.height; y += tile.height) {
    for (let x = 0; x < g.width; x += tile.width) {
      g.image(tile, x, y);
    }
  }

  // “mar” na parte de baixo (para o zoom começar azul)
  g.noStroke();
  g.fill(35, 90, 140, 170);
  g.ellipse(g.width * 0.65, g.height * 0.95, g.width * 1.5, g.height * 0.75);

  // água do rio/delta MAIS VERDE
  for (const pl of deltaNet) {
    g.stroke(60, 175, 140, 220);
    g.strokeWeight(pl.w);
    g.noFill();
    g.beginShape();
    for (const p of pl.pts) g.curveVertex(p.x, p.y);
    g.endShape();
  }

  // contorno de margens
  for (const pl of deltaNet) {
    g.stroke(10, 18, 14, 130);
    g.strokeWeight(max(1.2, pl.w * 0.10));
    g.noFill();
    g.beginShape();
    for (const p of pl.pts) {
      const j = (noise(p.x * 0.02, p.y * 0.02) - 0.5) * 2.0;
      g.curveVertex(p.x + j, p.y);
    }
    g.endShape();
  }

  // brilhos de água
  g.stroke(245, 255, 255, 28);
  g.strokeWeight(1);
  for (let i = 0; i < 2200; i++) {
    const x = random(g.width);
    const y = random(g.height);
    const n = noise(x * 0.01, y * 0.01);
    if (n > 0.62) g.point(x, y);
  }
}

// ============================================================
// GEOMETRIA DO RIO
// floodK faz o rio “virar mar” no final
// ============================================================
function riverCenterX(worldY, t) {
  const z = z01(worldY);
  const cx0 = width * 0.5;

  const amp = lerp(width * 0.03, width * 0.22, smoothstep(0.08, 0.80, z));
  const n1 = noise(worldY * 0.0015, t * 0.45);
  const n2 = noise(1000 + worldY * 0.004, t * 0.9);
  const n = n1 * 0.65 + n2 * 0.35;

  return cx0 + map(n, 0, 1, -amp, amp);
}

function riverHalfWidth(worldY, t, floodK) {
  const z = z01(worldY);

  const base = lerp(width * 0.03, width * 0.13, smoothstep(0.05, 0.70, z));
  const est  = lerp(0, width * 0.11, smoothstep(0.74, 0.96, z));
  const wob  = map(noise(2000 + worldY * 0.003, t * 0.6), 0, 1, -0.12, 0.12);

  let hw = (base + est) * (1 + wob * 0.18);

  // flood: aproxima para preencher tela (tipo mar)
  const target = width * 0.85;
  hw = lerp(hw, target, floodK);

  return hw;
}

function riverEdges(worldY, t, floodK) {
  const cx = riverCenterX(worldY, t);
  const hw = riverHalfWidth(worldY, t, floodK);
  const j = map(noise(3000 + worldY * 0.02, t * 1.2), 0, 1, -8, 8) * (1 - 0.7 * floodK);
  return { left: cx - hw + j, right: cx + hw + j, cx, hw };
}

// ============================================================
// ZONAS
// ============================================================
function z01(worldY) { return constrain(worldY / worldH, 0, 1); }

function zoneAt(worldY) {
  const z = z01(worldY);
  if (z < 0.18) return "spring";
  if (z < 0.60) return "forest";
  if (z < 0.78) return "plain";
  if (z < 0.90) return "estuary";
  return "ocean";
}

// ============================================================
// HELPERS
// ============================================================
function smoothstep(a, b, x) {
  const t = constrain((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  const travelFrames = max(1, (TOTAL_SECONDS - ZOOM_SECONDS - FLOOD_SECONDS) * FPS);
  speed = (worldH - height) / travelFrames;
}

function zoneAt(worldY) {
  const z = z01(worldY);
  if (z < 0.18) return "spring";
  if (z < 0.60) return "forest";
  if (z < 0.78) return "plain";
  if (z < 0.90) return "estuary";
  return "ocean";
}

// ============================================================
// HELPERS
// ============================================================
function smoothstep(a, b, x) {
  const t = constrain((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // recalcula velocidade (mantém 30s se você recarregar; resize durante execução ok)
  const travelFrames = max(1, (TOTAL_SECONDS - ZOOM_SECONDS) * FPS);
  speed = (worldH - height) / travelFrames;
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function smoothstep(a, b, x) {
  const t = constrain((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function jitter1(pass) {
  return (pass === 0 ? (random(-0.9, 0.9)) : (random(-0.5, 0.5)));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // mapa continua válido; se quiser map responsivo, posso adaptar depois

}

