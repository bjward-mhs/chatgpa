// main.js — minimal 2D “build & fly” starting point with gravity + thrust
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

const planet = { x: 0, y: 0, r: 120, mu: 2500 * 20000 };

let keys = new Set();
addEventListener("keydown", (e) => keys.add(e.code));
addEventListener("keyup", (e) => keys.delete(e.code));

let zoom = 1;
addEventListener("keydown", (e) => {
  if (e.code === "Equal") zoom *= 1.1;
  if (e.code === "Minus") zoom /= 1.1;
});

function makeRocket() {
  return {
    x: 0,
    y: -(planet.r + 40),
    vx: 120,
    vy: 0,
    angle: -Math.PI / 2,
    throttle: 0,
    stage: { dry: 8, fuel: 40, thrust: 900, burnRate: 6 },
  };
}
let rocket = makeRocket();

function mass() {
  return rocket.stage.dry + rocket.stage.fuel;
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // controls
  if (keys.has("KeyW")) rocket.throttle = Math.min(1, rocket.throttle + dt * 0.8);
  if (keys.has("KeyS")) rocket.throttle = Math.max(0, rocket.throttle - dt * 0.8);
  if (keys.has("KeyA")) rocket.angle -= dt * 2.2;
  if (keys.has("KeyD")) rocket.angle += dt * 2.2;

  // gravity
  const dx = planet.x - rocket.x;
  const dy = planet.y - rocket.y;
  const r2 = dx * dx + dy * dy;
  const r = Math.sqrt(r2);
  const axg = (planet.mu * dx) / (r2 * r);
  const ayg = (planet.mu * dy) / (r2 * r);

  // thrust
  let axt = 0, ayt = 0;
  if (rocket.stage.fuel > 0 && rocket.throttle > 0) {
    const burn = Math.min(rocket.stage.fuel, rocket.stage.burnRate * rocket.throttle * dt);
    rocket.stage.fuel -= burn;

    const a = (rocket.stage.thrust * rocket.throttle) / Math.max(1, mass());
    axt = Math.cos(rocket.angle) * a;
    ayt = Math.sin(rocket.angle) * a;
  }

  rocket.vx += (axg + axt) * dt;
  rocket.vy += (ayg + ayt) * dt;
  rocket.x += rocket.vx * dt;
  rocket.y += rocket.vy * dt;

  // collision
  if (r < planet.r + 6) {
    const nx = (rocket.x - planet.x) / (r || 1);
    const ny = (rocket.y - planet.y) / (r || 1);
    rocket.x = planet.x + nx * (planet.r + 6);
    rocket.y = planet.y + ny * (planet.r + 6);
    rocket.vx *= 0.2;
    rocket.vy *= 0.2;
  }

  // draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;

  const toScreen = (wx, wy) => [cx + (wx - rocket.x) * zoom, cy + (wy - rocket.y) * zoom];

  // planet
  {
    const [px, py] = toScreen(planet.x, planet.y);
    ctx.fillStyle = "#0a2";
    ctx.beginPath();
    ctx.arc(px, py, planet.r * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  // rocket
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

    if (rocket.stage.fuel > 0 && rocket.throttle > 0) {
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

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
