// Rio satélite suave + zoom out para delta (30s até tela final)
// p5.js

// -------------------- TEMPO --------------------
const FPS = 60;
const TOTAL_SECONDS = 30;
const ZOOM_SECONDS = 5;

// -------------------- MUNDO --------------------
let worldH = 9000;
let camY = 0;
let speed = 1.2;         // calculado no setup
let mode = "journey";    // "journey" | "zoomout"
let zoomStartFrame = 0;
let zoomDuration = ZOOM_SECONDS * FPS;

// -------------------- TEXTURAS --------------------
let landTex;   // textura tile do "satélite" (terra/vegetação)
let mapG;      // delta final (offscreen)
let deltaNet;  // linhas de canais

// -------------------- ÁGUA (partículas) --------------------
let particles = [];
const N_PART = 700;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // 30s total: (TOTAL - ZOOM) para viajar; ZOOM para zoom out
  zoomDuration = ZOOM_SECONDS * FPS;
  const travelFrames = max(1, (TOTAL_SECONDS - ZOOM_SECONDS) * FPS);
  speed = (worldH - height) / travelFrames;

  // textura de terra (tile)
  landTex = makeSatelliteLandTile(900, 700, 42);

  // partículas
  for (let i = 0; i < N_PART; i++) particles.push(spawnParticle());

  // delta final
  buildDeltaMap();
}

function draw() {
  const t = frameCount * 0.01;

  if (mode === "journey") {
    camY += speed;
    if (camY >= worldH - height) {
      camY = worldH - height;
      mode = "zoomout";
      zoomStartFrame = frameCount;
    }

    drawSatelliteBackground(t);
    drawRiver(camY, t);
    updateParticles(camY, t);
    drawAtmosHaze(camY, t);

  } else {
    drawFinalZoomOut();
  }
}

// ============================================================
// FUNDO SATÉLITE (tile + variação por faixa do mundo)
// ============================================================
function drawSatelliteBackground(t) {
  // tile base
  for (let y = 0; y < height; y += landTex.height) {
    for (let x = 0; x < width; x += landTex.width) {
      image(landTex, x, y);
    }
  }

  // ajuste de "bioma" por zona (tintas bem suaves por cima)
  noStroke();
  for (let y = 0; y < height; y += 6) {
    const worldY = camY + y;
    const z = z01(worldY);
    const zone = zoneAt(worldY);

    // overlay bem sutil (muda sensação por trecho)
    let ov;
    if (zone === "spring") ov = color(210, 220, 230, 10);     // serra mais fria
    else if (zone === "forest") ov = color(40, 80, 55, 10);   // mata mais densa
    else if (zone === "plain") ov = color(80, 95, 60, 8);     // planície
    else if (zone === "estuary") ov = color(60, 90, 70, 10);  // mangue/estuário
    else ov = color(50, 70, 110, 10);                         // oceano

    fill(ov);
    rect(0, y, width, 6);
  }
}

// tile de textura "satélite suave": solo + vegetação em mosaico + granulação
function makeSatelliteLandTile(w, h, seed) {
  randomSeed(seed);
  noiseSeed(seed);

  const g = createGraphics(w, h);
  g.pixelDensity(1);

  // base “solo”
  g.background(38, 52, 42);

  // mosaico de vegetação (tons variados)
  g.noStroke();
  for (let i = 0; i < 1200; i++) {
    const x = random(w), y = random(h);
    const n = noise(x * 0.008, y * 0.008);

    // paleta satélite: oliva/musgo/escuro/clareira
    const c1 = color(18, 45, 28, 40);
    const c2 = color(28, 62, 35, 40);
    const c3 = color(55, 85, 45, 36);
    const c4 = color(92, 110, 62, 30);

    let c;
    if (n < 0.33) c = lerpColor(c1, c2, n / 0.33);
    else if (n < 0.66) c = lerpColor(c2, c3, (n - 0.33) / 0.33);
    else c = lerpColor(c3, c4, (n - 0.66) / 0.34);

    g.fill(c);
    g.ellipse(x, y, random(10, 60), random(10, 55));
  }

  // manchas de solo/clareira
  for (let i = 0; i < 220; i++) {
    g.fill(80, 74, 55, random(10, 22));
    g.ellipse(random(w), random(h), random(30, 180), random(20, 120));
  }

  // sombras de copa (vendem realismo)
  for (let i = 0; i < 350; i++) {
    g.fill(0, 0, 0, random(8, 18));
    g.ellipse(random(w), random(h), random(40, 220), random(30, 150));
  }

  // granulação fina (satélite)
  g.stroke(15, 20, 16, 18);
  for (let i = 0; i < 12000; i++) g.point(random(w), random(h));

  // “linhas” orgânicas sutis (drenagem/relvo)
  g.stroke(120, 135, 105, 10);
  g.strokeWeight(1);
  for (let k = 0; k < 90; k++) {
    let x = random(w), y = random(h);
    g.beginShape();
    for (let i = 0; i < 40; i++) {
      const a = noise(200 + x * 0.01, 200 + y * 0.01) * TWO_PI * 2;
      x += cos(a) * 3.2;
      y += sin(a) * 2.6;
      g.curveVertex(x, y);
    }
    g.endShape();
  }

  return g;
}

// ============================================================
// RIO (polígono + cor variável + brilho suave)
// ============================================================
function drawRiver(camY, t) {
  const step = 14;
  let L = [], R = [];

  for (let sy = -step; sy <= height + step; sy += step) {
    const worldY = camY + sy;
    const e = riverEdges(worldY, t);
    L.push({ x: e.left, y: sy });
    R.push({ x: e.right, y: sy });
  }

  const zone = zoneAt(camY + height * 0.5);

  // água “satélite” (verde-azulada no meio; mais clara no estuário; mais azul no oceano)
  let water = color(75, 130, 125, 185);
  if (zone === "spring")  water = color(85, 150, 150, 190);
  if (zone === "forest")  water = color(65, 120, 115, 190);
  if (zone === "plain")   water = color(68, 125, 120, 190);
  if (zone === "estuary") water = color(82, 150, 150, 195);
  if (zone === "ocean")   water = color(60, 95, 140, 205);

  // preenchimento do leito
  noStroke();
  fill(water);
  beginShape();
  for (const p of L) vertex(p.x, p.y);
  for (let i = R.length - 1; i >= 0; i--) vertex(R[i].x, R[i].y);
  endShape(CLOSE);

  // brilho/sedimento (textura dentro da água)
  stroke(230, 245, 245, 26);
  strokeWeight(1);
  const lines = 10;
  for (let k = 0; k < lines; k++) {
    beginShape();
    for (let sy = 0; sy <= height; sy += step) {
      const worldY = camY + sy;
      const e = riverEdges(worldY, t);
      const u = (k + 1) / (lines + 1);
      let x = lerp(e.cx - e.hw, e.cx + e.hw, u);
      x += map(noise(k * 9, worldY * 0.01, t), 0, 1, -12, 12);
      curveVertex(x, sy);
    }
    endShape();
  }

  // oceano: ondulação leve na parte inferior
  if (zone === "ocean") {
    stroke(255, 255, 255, 18);
    for (let i = 0; i < 10; i++) {
      const yy = height * 0.55 + i * 22;
      beginShape();
      for (let x = 0; x <= width; x += 18) {
        vertex(x, yy + sin(x * 0.02 + t * 2 + i) * 6);
      }
      endShape();
    }
  }
}

// ============================================================
// PARTÍCULAS (correnteza discreta)
// ============================================================
function spawnParticle() {
  return {
    x: random(width),
    y: random(height),
    speed: random(0.8, 1.8),
    size: random(1.0, 2.0),
    life: random(80, 220)
  };
}

function updateParticles(camY, t) {
  for (const p of particles) {
    const worldY = camY + p.y;
    const e = riverEdges(worldY, t);

    // fluxo: puxa pro centro + desce
    let vx = map(noise(p.x * 0.003, worldY * 0.004, t), 0, 1, -0.8, 0.8);
    let vy = map(noise(500 + p.x * 0.002, worldY * 0.003, t), 0, 1, 1.0, 1.8);
    vx += (e.cx - p.x) * 0.0022;

    p.x += vx * p.speed;
    p.y += vy * p.speed;

    // manter dentro do leito
    if (p.x < e.left + 6 || p.x > e.right - 6) {
      p.x = lerp(e.left + 10, e.right - 10, random());
    }

    // desenha
    stroke(245, 255, 255, 45);
    strokeWeight(p.size);
    point(p.x, p.y);

    // recicla
    p.life -= 1;
    if (p.y > height + 40 || p.life <= 0) {
      p.y = random(-80, -10);
      p.x = random(width);
      p.life = random(90, 240);
    }
  }
}

// ============================================================
// ATMOSFERA (neblina/umidade suave por cima)
// ============================================================
function drawAtmosHaze(camY, t) {
  const zMid = z01(camY + height * 0.5);

  // mais neblina na serra e um pouco no estuário/oceano
  let strength = 0.0;
  if (zMid < 0.22) strength = lerp(0.55, 0.20, smoothstep(0.02, 0.22, zMid));
  if (zMid > 0.75) strength = max(strength, lerp(0.10, 0.30, smoothstep(0.75, 1.0, zMid)));

  noStroke();
  for (let i = 0; i < 8; i++) {
    const yy = (i / 8) * height;
    const a = 22 * strength;
    fill(220, 240, 255, a);
    ellipse(width * 0.5, yy, width * (1.15 + noise(i * 10, t * 0.2) * 0.25), height * 0.22);
  }
}

// ============================================================
// ZOOM OUT FINAL (delta estilo satélite suave)
// ============================================================
function drawFinalZoomOut() {
  const u = constrain((frameCount - zoomStartFrame) / zoomDuration, 0, 1);
  const e = easeInOutCubic(u);

  background(20, 28, 24);

  // escala: começa mais "perto", sai para revelar o delta
  const s = lerp(1.35, 0.88, e);

  // drift discreto no começo
  const drift = (1 - e);
  const dx = (noise(frameCount * 0.01) - 0.5) * 18 * drift;
  const dy = (noise(999 + frameCount * 0.01) - 0.5) * 18 * drift;

  push();
  translate(width / 2 + dx, height / 2 + dy);
  scale(s);
  translate(-mapG.width / 2, -mapG.height / 2);
  image(mapG, 0, 0);
  pop();

  // legenda minimal (some no começo e aparece no fim)
  noStroke();
  fill(235, 245, 240, 180 * e);
  textAlign(LEFT, BOTTOM);
  textSize(14);
  text("Delta / Estuário — satélite suave", 16, height - 16);
}

function buildDeltaMap() {
  const mw = 1200, mh = 800;
  mapG = createGraphics(mw, mh);
  mapG.pixelDensity(1);

  deltaNet = generateDeltaNetwork(mw, mh, 1234);
  renderDeltaMap();
}

function generateDeltaNetwork(mw, mh, seed) {
  randomSeed(seed);
  noiseSeed(seed);

  const polylines = [];

  // canal principal (mais largo)
  const main = [];
  let x = mw * 0.62;
  let y = mh * 0.12;
  let ang = PI / 2 + random(-0.12, 0.12);

  const steps = 240;
  for (let i = 0; i < steps; i++) {
    main.push({ x, y });

    const n = noise(i * 0.06, seed * 0.01);
    ang += map(n, 0, 1, -0.06, 0.06);

    const t = i / steps;
    const sp = lerp(3.0, 4.4, t);
    x += cos(ang) * sp;
    y += sin(ang) * sp;

    // abre o leque no fim
    if (t > 0.62) x += random(-0.8, 0.8);

    x = constrain(x, 70, mw - 70);
    y = constrain(y, 60, mh - 60);
  }
  polylines.push({ pts: main, w: 28 });

  // ramificações (labirinto)
  const branchCount = 70;
  for (let b = 0; b < branchCount; b++) {
    const idx = floor(random(90, steps - 12));
    const p0 = main[idx];
    const p1 = main[min(idx + 1, main.length - 1)];
    const dir = atan2(p1.y - p0.y, p1.x - p0.x);

    const sign = random() < 0.5 ? -1 : 1;
    let a = dir + sign * random(0.35, 1.25);

    let bx = p0.x + random(-8, 8);
    let by = p0.y + random(-8, 8);

    const len = floor(random(60, 190));
    const pts = [];
    for (let i = 0; i < len; i++) {
      pts.push({ x: bx, y: by });

      const nn = noise(500 + b * 10, i * 0.05);
      a += map(nn, 0, 1, -0.08, 0.08);

      const tt = i / len;
      const sp = lerp(2.2, 3.8, tt);
      bx += cos(a) * sp;
      by += sin(a) * sp;

      // puxa para baixo (mar)
      by += 0.35;

      if (bx < 35 || bx > mw - 35 || by < 35 || by > mh - 35) break;
    }

    const w = random(6, 14);
    polylines.push({ pts, w });
  }

  return polylines;
}

function renderDeltaMap() {
  const g = mapG;
  g.background(18, 28, 22);

  // textura de terra (satélite) por baixo
  // (mini-tile gerado inline)
  const tile = makeSatelliteLandTile(600, 450, 99);
  for (let y = 0; y < g.height; y += tile.height) {
    for (let x = 0; x < g.width; x += tile.width) {
      g.image(tile, x, y);
    }
  }

  // água (preenchimento dos canais) - 2 passadas: largo + contorno leve
  for (const pl of deltaNet) {
    g.stroke(92, 160, 155, 210);
    g.strokeWeight(pl.w);
    g.noFill();
    g.beginShape();
    for (const p of pl.pts) g.curveVertex(p.x, p.y);
    g.endShape();
  }

  // contorno escuro nas margens (define canais)
  for (const pl of deltaNet) {
    g.stroke(10, 18, 16, 120);
    g.strokeWeight(max(1.2, pl.w * 0.10));
    g.noFill();
    g.beginShape();
    for (const p of pl.pts) {
      const j = (noise(p.x * 0.02, p.y * 0.02) - 0.5) * 2.0;
      g.curveVertex(p.x + j, p.y);
    }
    g.endShape();
  }

  // brilhos/espelhos na água
  g.stroke(245, 255, 255, 32);
  g.strokeWeight(1);
  for (let i = 0; i < 2600; i++) {
    const x = random(g.width);
    const y = random(g.height);
    const n = noise(x * 0.01, y * 0.01);
    if (n > 0.62) g.point(x, y);
  }

  // oceano sugerido (baixo)
  g.noStroke();
  g.fill(40, 70, 110, 120);
  g.ellipse(g.width * 0.72, g.height * 0.92, g.width * 1.2, g.height * 0.65);
}

// ============================================================
// GEOMETRIA DO RIO DA VIAGEM
// ============================================================
function riverCenterX(worldY, t) {
  const z = z01(worldY);
  const cx0 = width * 0.5;

  // meandro cresce ao longo do curso
  const amp = lerp(width * 0.04, width * 0.24, smoothstep(0.08, 0.80, z));

  const n1 = noise(worldY * 0.0015, t * 0.45);
  const n2 = noise(1000 + worldY * 0.004, t * 0.9);
  const n = n1 * 0.65 + n2 * 0.35;

  return cx0 + map(n, 0, 1, -amp, amp);
}

function riverHalfWidth(worldY, t) {
  const z = z01(worldY);

  // cresce: nascente estreita -> rio -> estuário bem largo
  const base = lerp(width * 0.03, width * 0.13, smoothstep(0.05, 0.70, z));
  const est = lerp(0, width * 0.12, smoothstep(0.74, 0.96, z));
  const wob = map(noise(2000 + worldY * 0.003, t * 0.6), 0, 1, -0.12, 0.12);

  return (base + est) * (1 + wob * 0.22);
}

function riverEdges(worldY, t) {
  const cx = riverCenterX(worldY, t);
  const hw = riverHalfWidth(worldY, t);
  const j = map(noise(3000 + worldY * 0.02, t * 1.2), 0, 1, -8, 8);
  return { left: cx - hw + j, right: cx + hw + j, cx, hw };
}

// ============================================================
// ZONAS
// ============================================================
function z01(worldY) {
  return constrain(worldY / worldH, 0, 1);
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
