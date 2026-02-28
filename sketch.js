// Rio (ilustrado) + Zoom out final para "mapa" de delta/estuário inspirado na imagem
// p5.js
let speed = 1.35;
let zoomDuration = 420;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  const TOTAL_SECONDS = 30;
  const ZOOM_SECONDS = 5;
  const FPS = 60;

  zoomDuration = ZOOM_SECONDS * FPS;

  const travelFrames = (TOTAL_SECONDS - ZOOM_SECONDS) * FPS;
  speed = (worldH - height) / travelFrames;

  // resto do setup...
}
let camY = 0;
let worldH = 9000;


// transição final
let mode = "journey";     // "journey" | "zoomout"
let zoomStartFrame = 0;


// partículas
let particles = [];
const N_PART = 850;

// mapa do delta (offscreen)
let mapG;
let delta = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // partículas
  for (let i = 0; i < N_PART; i++) particles.push(spawnParticle(random(worldH)));

  // gera mapa do delta uma vez
  buildDeltaMap();
}

function draw() {
  const t = frameCount * 0.008;

  if (mode === "journey") {
    camY += speed;
    if (camY > worldH - height) camY = worldH - height;

    drawIllustratedBackground(camY, t);
    drawIllustratedTerrainAndForest(camY, t);
    drawIllustratedRiver(camY, t);
    drawBankTrees(camY, t);
    updateParticles(camY, t);
    drawInkWash(camY, t);

    // quando chega perto do final, dispara o zoom out
    if (camY >= worldH - height - 30) {
      mode = "zoomout";
      zoomStartFrame = frameCount;
    }
  } else {
    // transição de zoom out + mapa delta
    const u = constrain((frameCount - zoomStartFrame) / zoomDuration, 0, 1);
    const e = easeInOutCubic(u);

    // fundo "papel"
    background(236, 232, 220);

    // desenha o mapa com escala animada (começa grande e vai "saindo")
    // scale vai de ~1.35 (perto) para ~0.85 (mais afastado)
    const s = lerp(1.35, 0.85, e);
    // leve drift pra dar sensação de câmera estabilizando
    const driftX = (noise(frameCount * 0.01) - 0.5) * 10 * (1 - e);
    const driftY = (noise(999 + frameCount * 0.01) - 0.5) * 10 * (1 - e);

    push();
    translate(width / 2 + driftX, height / 2 + driftY);
    scale(s);
    translate(-mapG.width / 2, -mapG.height / 2);
    image(mapG, 0, 0);
    pop();

    // texto suave (opcional)
    drawCaption(e);

    // se quiser loopar a viagem: quando terminar o zoom, reinicia
    // (se não quiser, pode remover esse bloco)
    if (u >= 1) {
      // fica parado mostrando o delta (sem reiniciar)
      // (comente as próximas 2 linhas se quiser reiniciar em loop)
      // camY = 0; mode = "journey";
    }
  }
}

// ------------------------------------------------------------
// ILUSTRAÇÃO: BACKGROUND / PAPEL / ATMOSFERA
// ------------------------------------------------------------
function drawIllustratedBackground(camY, t) {
  // base de "papel" + gradiente por zona
  for (let y = 0; y < height; y += 3) {
    const worldY = camY + y;
    const z = z01(worldY);
    const zone = zoneAt(worldY);

    // paleta ilustrada (mais fosca)
    let c;
    if (zone === "spring") c = color(230, 232, 225);
    else if (zone === "forest") c = color(226, 232, 224);
    else if (zone === "plain") c = color(228, 232, 222);
    else if (zone === "estuary") c = color(230, 231, 224);
    else c = color(232, 232, 226);

    // leve “lavagem” com ruído
    const wash = map(noise(y * 0.01, t * 0.2), 0, 1, 0.95, 1.05);
    fill(red(c) * wash, green(c) * wash, blue(c) * wash, 255);
    rect(0, y, width, 3);
  }
}

function drawInkWash(camY, t) {
  // vinheta suave + granulação (ilustrado)
  noStroke();
  for (let i = 0; i < 10; i++) {
    const a = 10;
    fill(40, 35, 30, a);
    ellipse(width * 0.5, height * 0.5, width * (1.0 + i * 0.08), height * (1.0 + i * 0.08));
  }
  // leve “grão”
  stroke(60, 55, 45, 10);
  strokeWeight(1);
  for (let k = 0; k < 220; k++) {
    point(random(width), random(height));
  }
}

// ------------------------------------------------------------
// ILUSTRAÇÃO: RELEVO + MATA (silhueta + textura)
// ------------------------------------------------------------
function drawIllustratedTerrainAndForest(camY, t) {
  const zMid = z01(camY + height * 0.5);

  // massa de relevo (serra) no topo da viagem
  if (zMid < 0.30) {
    noStroke();
    fill(70, 90, 70, 35);
    beginShape();
    vertex(0, height);
    for (let x = 0; x <= width; x += 16) {
      const n = noise(x * 0.004, (camY * 0.0007) + t * 0.25);
      const yy = height * 0.65 - n * (width * 0.20);
      vertex(x, yy);
    }
    vertex(width, height);
    endShape(CLOSE);
  }

  // manchas de vegetação (pinceladas)
  noStroke();
  const step = 22;
  for (let y = 0; y < height; y += step) {
    const worldY = camY + y;
    const zone = zoneAt(worldY);
    if (zone === "ocean") continue;

    let dens = 0.0;
    if (zone === "forest") dens = 0.85;
    if (zone === "plain") dens = 0.35;
    if (zone === "spring") dens = 0.20;
    if (zone === "estuary") dens = 0.50;

    for (let i = 0; i < 6; i++) {
      const x = random(width);
      const n = noise(x * 0.01, worldY * 0.01);
      if (n > 0.60 && random() < dens * 0.12) {
        fill(40, 70, 45, 22);
        ellipse(x, y + random(-10, 10), random(30, 90), random(18, 60));
      }
    }
  }
}

// ------------------------------------------------------------
// ILUSTRAÇÃO: RIO (traço + preenchimento + textura)
// ------------------------------------------------------------
function drawIllustratedRiver(camY, t) {
  const step = 14;
  let left = [];
  let right = [];

  for (let sy = -step; sy <= height + step; sy += step) {
    const worldY = camY + sy;
    const e = riverEdges(worldY, t);
    left.push({ x: e.left, y: sy });
    right.push({ x: e.right, y: sy });
  }

  const zone = zoneAt(camY + height * 0.5);

  // cores mais “tinta”
  let fillC = color(120, 175, 185, 140);
  if (zone === "forest") fillC = color(110, 165, 175, 150);
  if (zone === "estuary") fillC = color(105, 160, 170, 155);
  if (zone === "ocean") fillC = color(95, 145, 165, 165);

  // preenchimento
  noStroke();
  fill(fillC);
  beginShape();
  for (const p of left) vertex(p.x, p.y);
  for (let i = right.length - 1; i >= 0; i--) vertex(right[i].x, right[i].y);
  endShape(CLOSE);

  // contorno "mão" (duas passadas com jitter)
  for (let pass = 0; pass < 2; pass++) {
    stroke(25, 40, 45, pass === 0 ? 70 : 35);
    strokeWeight(pass === 0 ? 1.5 : 1.0);
    noFill();
    beginShape();
    for (const p of left) vertex(p.x + jitter1(pass), p.y);
    endShape();
    beginShape();
    for (const p of right) vertex(p.x + jitter1(pass), p.y);
    endShape();
  }

  // textura interna (linhas de corrente)
  stroke(240, 250, 250, 35);
  strokeWeight(1);
  const lines = 10;
  for (let k = 0; k < lines; k++) {
    beginShape();
    for (let sy = 0; sy <= height; sy += step) {
      const worldY = camY + sy;
      const e = riverEdges(worldY, t);
      const u = (k + 1) / (lines + 1);
      let x = lerp(e.cx - e.hw, e.cx + e.hw, u);
      x += map(noise(k * 11, worldY * 0.01, t * 1.4), 0, 1, -14, 14);
      vertex(x, sy);
    }
    endShape();
  }
}

function drawBankTrees(camY, t) {
  // árvores simples (ícone) distribuídas ao longo das margens
  // determinístico via noise (não explode a cena)
  const step = 26;
  for (let sy = 0; sy <= height; sy += step) {
    const worldY = camY + sy;
    const zone = zoneAt(worldY);
    if (zone === "ocean") continue;

    const e = riverEdges(worldY, t);

    // lado esquerdo
    placeTreeLine(e.left - 18, sy, worldY, -1);

    // lado direito
    placeTreeLine(e.right + 18, sy, worldY, +1);
  }
}

function placeTreeLine(baseX, sy, worldY, side) {
  // chance de árvore aumenta na mata, diminui na planície
  const zone = zoneAt(worldY);
  let p = 0.0;
  if (zone === "forest") p = 0.45;
  if (zone === "spring") p = 0.20;
  if (zone === "plain") p = 0.18;
  if (zone === "estuary") p = 0.30;

  const n = noise(baseX * 0.02, worldY * 0.01);
  if (n < 0.62 || random() > p) return;

  const x = baseX + side * random(6, 34);
  const h = random(18, 36);

  // tronco
  stroke(40, 55, 45, 85);
  strokeWeight(2);
  line(x, sy + h * 0.35, x, sy + h);

  // copa (triângulo + bolinhas)
  noStroke();
  fill(25, 60, 40, 90);
  triangle(x, sy, x - h * 0.35, sy + h * 0.55, x + h * 0.35, sy + h * 0.55);
  fill(25, 70, 45, 55);
  ellipse(x - h * 0.18, sy + h * 0.35, h * 0.35, h * 0.28);
  ellipse(x + h * 0.18, sy + h * 0.35, h * 0.35, h * 0.28);
}

// ------------------------------------------------------------
// PARTÍCULAS (correnteza)
// ------------------------------------------------------------
function spawnParticle(worldY) {
  return {
    x: random(width),
    y: random(height),
    speed: random(0.7, 1.8),
    size: random(1.0, 2.0),
    life: random(80, 240)
  };
}

function updateParticles(camY, t) {
  for (const p of particles) {
    const worldY = camY + p.y;
    const e = riverEdges(worldY, t);

    let vx = map(noise(p.x * 0.003, worldY * 0.004, t), 0, 1, -0.8, 0.8);
    let vy = map(noise(500 + p.x * 0.002, worldY * 0.003, t), 0, 1, 0.9, 1.7);

    // puxa pro centro
    vx += (e.cx - p.x) * 0.002;

    p.x += vx * p.speed;
    p.y += vy * p.speed;

    if (p.x < e.left + 6 || p.x > e.right - 6) {
      p.x = lerp(e.left + 10, e.right - 10, random());
    }

    // desenha espuma discreta
    stroke(250, 255, 255, 55);
    strokeWeight(p.size);
    point(p.x, p.y);

    p.life -= 1;
    if (p.y > height + 40 || p.life <= 0) {
      p.y = random(-80, -10);
      p.x = random(width);
      p.life = random(90, 260);
    }
  }
}

// ------------------------------------------------------------
// MAPA DO DELTA (zoom out final)
// ------------------------------------------------------------
function buildDeltaMap() {
  const mw = 1200;  // pode aumentar pra mais detalhe
  const mh = 800;
  mapG = createGraphics(mw, mh);
  mapG.pixelDensity(1);

  // gera rede de canais
  delta = generateDeltaNetwork(mw, mh, 1234);

  // desenha uma vez (estilo ilustrado)
  renderDeltaMap();
}

function generateDeltaNetwork(mw, mh, seed) {
  randomSeed(seed);
  noiseSeed(seed);

  const polylines = [];

  // canal principal
  const main = [];
  let x = mw * 0.58;
  let y = mh * 0.12;
  let ang = PI / 2 + random(-0.15, 0.15);

  const steps = 220;
  for (let i = 0; i < steps; i++) {
    main.push({ x, y });

    // meandro suave
    const n = noise(i * 0.06, seed * 0.01);
    ang += map(n, 0, 1, -0.07, 0.07);

    // tendência a abrir leque no fim (estuário)
    const t = i / steps;
    ang += map(noise(99 + i * 0.04), 0, 1, -0.02, 0.02) + (t > 0.6 ? random(-0.02, 0.02) : 0);

    const sp = lerp(3.2, 4.2, t);
    x += cos(ang) * sp;
    y += sin(ang) * sp;

    // mantém no quadro
    x = constrain(x, 60, mw - 60);
    y = constrain(y, 50, mh - 60);
  }
  polylines.push({ pts: main, w: 24 });

  // ramificações (tipo imagem)
  const branchCount = 42;
  for (let b = 0; b < branchCount; b++) {
    // escolhe um ponto na parte final do canal principal
    const idx = floor(random(80, steps - 10));
    const p0 = main[idx];
    const p1 = main[min(idx + 1, main.length - 1)];

    const dir = atan2(p1.y - p0.y, p1.x - p0.x);
    const sign = random() < 0.5 ? -1 : 1;
    let a = dir + sign * random(0.25, 1.10);

    let bx = p0.x + random(-6, 6);
    let by = p0.y + random(-6, 6);

    const len = floor(random(40, 140));
    const pts = [];
    for (let i = 0; i < len; i++) {
      pts.push({ x: bx, y: by });

      const nn = noise(500 + b * 10, i * 0.06);
      a += map(nn, 0, 1, -0.08, 0.08);

      const t = i / len;
      const sp = lerp(2.4, 3.6, t);
      bx += cos(a) * sp;
      by += sin(a) * sp;

      // “atrai” para fora (abre o delta)
      by += 0.35;

      // limites
      if (bx < 30 || bx > mw - 30 || by < 30 || by > mh - 30) break;
    }

    const w = random(6, 14);
    polylines.push({ pts, w });
  }

  return polylines;
}

function renderDeltaMap() {
  const g = mapG;
  g.clear();

  // papel
  g.background(236, 232, 220);

  // massa de vegetação (pinceladas)
  g.noStroke();
  for (let i = 0; i < 260; i++) {
    const x = random(g.width);
    const y = random(g.height);
    const a = random(12, 26);
    g.fill(70, 110, 75, a);
    g.ellipse(x, y, random(40, 160), random(30, 120));
  }

  // canais (primeiro preenchimento largo, depois contorno)
  for (const pl of delta) {
    // “água” levemente esverdeada
    g.stroke(120, 185, 190, 165);
    g.strokeWeight(pl.w);
    g.noFill();
    g.beginShape();
    for (const p of pl.pts) g.curveVertex(p.x, p.y);
    g.endShape();
  }

  // contorno escuro (tinta)
  for (const pl of delta) {
    g.stroke(35, 55, 60, 90);
    g.strokeWeight(max(1.2, pl.w * 0.08));
    g.noFill();
    g.beginShape();
    for (const p of pl.pts) g.curveVertex(p.x + map(noise(p.x * 0.02, p.y * 0.02), 0, 1, -1.5, 1.5), p.y);
    g.endShape();
  }

  // canais menores “brilhos”
  g.stroke(245, 252, 252, 45);
  g.strokeWeight(1);
  for (let i = 0; i < 2200; i++) {
    const x = random(g.width);
    const y = random(g.height);
    const n = noise(x * 0.01, y * 0.01);
    if (n > 0.55) g.point(x, y);
  }

  // árvores/vegetação em ícones (bem leve)
  for (let i = 0; i < 260; i++) {
    const x = random(g.width);
    const y = random(g.height);
    const n = noise(100 + x * 0.01, 200 + y * 0.01);
    if (n < 0.52) continue;
    drawTinyTree(g, x, y, random(8, 16));
  }

  // “mar” no canto inferior direito (sugestão)
  g.noStroke();
  g.fill(180, 210, 220, 120);
  g.ellipse(g.width * 0.85, g.height * 0.92, g.width * 0.9, g.height * 0.6);
}

function drawTinyTree(g, x, y, s) {
  g.noStroke();
  g.fill(40, 85, 55, 70);
  g.triangle(x, y - s * 0.9, x - s * 0.6, y + s * 0.2, x + s * 0.6, y + s * 0.2);
  g.fill(40, 70, 50, 60);
  g.ellipse(x, y - s * 0.15, s * 0.7, s * 0.55);
}

// ------------------------------------------------------------
// RIO: geometria (igual antes)
// ------------------------------------------------------------
function riverCenterX(worldY, t) {
  const z = z01(worldY);
  const cx0 = width * 0.5;
  const amp = lerp(width * 0.03, width * 0.22, smoothstep(0.08, 0.75, z));
  const n1 = noise(worldY * 0.0015, t * 0.45);
  const n2 = noise(1000 + worldY * 0.004, t * 0.9);
  const n = (n1 * 0.65 + n2 * 0.35);
  return cx0 + map(n, 0, 1, -amp, amp);
}

function riverHalfWidth(worldY, t) {
  const z = z01(worldY);
  const base = lerp(width * 0.028, width * 0.13, smoothstep(0.05, 0.70, z));
  const est = lerp(0, width * 0.11, smoothstep(0.75, 0.95, z));
  const wobble = map(noise(2000 + worldY * 0.003, t * 0.6), 0, 1, -0.12, 0.12);
  return (base + est) * (1 + wobble * 0.25);
}

function riverEdges(worldY, t) {
  const cx = riverCenterX(worldY, t);
  const hw = riverHalfWidth(worldY, t);
  const jitter = map(noise(3000 + worldY * 0.02, t * 1.4), 0, 1, -8, 8);
  return { left: cx - hw + jitter, right: cx + hw + jitter, cx, hw };
}

// ------------------------------------------------------------
// ZONAS
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// UI / CAPTION
// ------------------------------------------------------------
function drawCaption(e) {
  const a = 220 * e;
  noStroke();
  fill(25, 25, 25, a);
  textAlign(LEFT, BOTTOM);
  textSize(16);
  text("Zoom out — Estuário / Delta (estilo ilustrado)", 18, height - 18);
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