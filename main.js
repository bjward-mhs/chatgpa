const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

const ui = {
  throttle: document.getElementById("throttle"),
  tval: document.getElementById("tval"),
  reset: document.getElementById("reset"),
  stage: document.getElementById("stage"),
  readout: document.getElementById("readout"),
};

let keys = new Set();
addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Space") stage();
  if (e.code === "KeyR") reset();
});
addEventListener("keyup", (e) => keys.delete(e.code));

let zoom = 1;
addEventListener("keydown", (e) => {
  if (e.code === "Equal") zoom *= 1.1;
  if (e.code === "Minus") zoom /= 1.1;
});

const G = 2500;          // tuned for “game feel”, not realism
const planet = { x: 0, y: 0, r: 120, mu: G * 20000 }; // mu = GM

function makeRocket() {
  // Simple “parts”: capsule + 2 stages (each stage is dryMass + fuel + engine).
  return {
    x: 0,
    y: -(planet.r + 40),
    vx: 120,  // start with a sideways velocity so you can see “orbit-like” motion
    vy: 0,
    angle: -Math.PI / 2,
    angVel: 0,
    throttle: 0,
    stages: [
      { dry: 8, fuel: 0, maxFuel: 0, thrust: 0, burnRate: 0 }, // capsule (no engine)
      { dry: 10, fuel: 30, maxFuel: 30, thrust: 900, burnRate: 6 },
      { dry: 8, fuel: 20, maxFuel: 20, thrust: 650, burnRate: 4.5 },
    ],
    activeStage: 2, // start on bottom stage
  };
}

let rocket = makeRocket();

function totalMass() {
  let m = 0;
  for (let i = 0; i <= rocket.activeStage; i++) {
    const s = rocket.stages[i];
    m += s.dry + s.fuel;
  }
  return m;
}

function stage() {
  if (rocket.activeStage > 0) rocket.activeStage -= 1;
}
function reset() {
  rocket = makeRocket();
  zoom = 1;
  ui.throttle.value = "0";
}

ui.stage.onclick = stage;
ui.reset.onclick = reset;

function step(dt) {
  // input
  if (keys.has("KeyW")) rocket.throttle = Math.min(1, rocket.throttle + dt * 0.8);
  if (keys.has("KeyS")) rocket.throttle = Math.max(0, rocket.throttle - dt * 0.8);
  if (keys.has("KeyA")) rocket.angle -= dt * 2.2;
  if (keys.has("KeyD")) rocket.angle += dt * 2.2;

  // sync UI slider
  const slider = Number(ui.throttle.value);
  // if user is dragging slider, it overrides
  if (document.activeElement === ui.throttle) rocket.throttle = slider;
  ui.throttle.value = rocket.throttle.toFixed(2);
  ui.tval.textContent = rocket.throttle.toFixed(2);

  // gravity (single-body Newtonian)
  const dx = planet.x - rocket.x;
  const dy = planet.y - rocket.y;
  const r2 = dx * dx + dy * dy;
  const r = Math.sqrt(r2);
  const axg = (planet.mu * dx) / (r2 * r);
  const ayg = (planet.mu * dy) / (r2 * r);

  // thrust (if current stage has engine and fuel)
  let axt = 0, ayt = 0;
  const s = rocket.stages[rocket.activeStage];
  if (s.thrust > 0 && s.fuel > 0 && rocket.throttle > 0) {
    const burn = Math.min(s.fuel, s.burnRate * rocket.throttle * dt);
    s.fuel -= burn;

    const m = totalMass();
    const a = (s.thrust * rocket.throttle) / Math.max(1, m);
    const ux = Math.cos(rocket.angle);
    const uy = Math.sin(rocket.angle);
    axt = ux * a;
    ayt = uy * a;
  }

  rocket.vx += (axg + axt) * dt;
  rocket.vy += (ayg + ayt) * dt;
  rocket.x += rocket.vx * dt;
  rocket.y += rocket.vy * dt;

  // collision with planet (simple)
  if (r < planet.r + 6) {
    // push out and damp velocity
    const nx = (rocket.x - planet.x) / (r || 1);
    const ny = (rocket.y - planet.y) / (r || 1);
    rocket.x = planet.x + nx * (planet.r + 6);
    rocket.y = planet.y + ny * (planet.r + 6);
    rocket.vx *= 0.2;
    rocket.vy *= 0.2;
  }

  // readout
  ui.readout.textContent =
    `Stage ${rocket.activeStage} | ` +
    `m=${totalMass().toFixed(1)} | ` +
    `alt=${Math.max(0, r - planet.r).toFixed(1)} | ` +
    `v=${Math.hypot(rocket.vx, rocket.vy).toFixed(1)}`;
}

function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  // camera centered on rocket
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;

  function toScreen(wx, wy) {
    return [cx + (wx - rocket.x) * zoom, cy + (wy - rocket.y) * zoom];
  }

  // planet
  {
    const [px, py] = toScreen(planet.x, planet.y);
    ctx.fillStyle = "#0a2";
    ctx.beginPath();
    ctx.arc(px, py, planet.r * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  // predicted path (simple forward integration)
  {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    let tx = rocket.x, ty = rocket.y, tvx = rocket.vx, tvy = rocket.vy;
    for (let i = 0; i < 500; i++) {
      const dx = planet.x - tx, dy = planet.y - ty;
      const r2 = dx*dx + dy*dy;
      const r = Math.sqrt(r2);
      const ax = (planet.mu * dx) / (r2 * r);
      const ay = (planet.mu * dy) / (r2 * r);
      const h = 0.03;
      tvx += ax * h; tvy += ay * h;
      tx += tvx * h; ty += tvy * h;

      const [sx, sy] = toScreen(tx, ty);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);

      if (r < planet.r + 2) break;
    }
    ctx.stroke();
  }

  // rocket (triangle)
  {
    const [rx, ry] = toScreen(rocket.x, rocket.y);
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rocket.angle);
    ctx.scale(zoom, zoom);

    ctx.fillStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();

    // flame
    const s = rocket.stages[rocket.activeStage];
    if (s.thrust > 0 && s.fuel > 0 && rocket.throttle > 0) {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-16 - 18 * rocket.throttle, -3);
      ctx.lineTo(-16 - 18 * rocket.throttle, 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // simulate with a couple substeps for stability
  const sub = 2;
  for (let i = 0; i < sub; i++) step(dt / sub);

  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
