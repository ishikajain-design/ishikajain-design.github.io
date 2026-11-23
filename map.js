const map = document.querySelector("#map");
const routeSvg = document.querySelector("#routes");
const knotSvg = document.querySelector("#knots");
const avatar = document.querySelector("#avatar");
const intro = document.querySelector("#intro");
const worlds = [...document.querySelectorAll(".world")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const portraitQuery = matchMedia("(max-aspect-ratio: 9/10)");

const landscapeEdges = [
  { id: "start-graphic", a: "start", b: "graphic-design", from: "start-graphic", to: "graphic-start", shape: "hvh" },
  { id: "start-about", a: "start", b: "about-me", from: "start-about", to: "about-start", shape: "vh" },
  { id: "start-ux", a: "start", b: "ux-design", from: "start-ux", to: "ux-start", shape: "vh" },
  { id: "graphic-about", a: "graphic-design", b: "about-me", from: "graphic-about", to: "about-graphic", shape: "hv" },
  { id: "about-ux", a: "about-me", b: "ux-design", from: "about-ux", to: "ux-about", shape: "vh" },
];
const portraitEdges = [
  { id: "start-graphic", a: "start", b: "graphic-design", from: "start-ux", to: "graphic-start", shape: "vh" },
  { id: "graphic-about", a: "graphic-design", b: "about-me", from: "graphic-about", to: "about-ux", shape: "vh" },
  { id: "about-ux", a: "about-me", b: "ux-design", from: "about-start", to: "ux-start", shape: "vh" },
];

let activeEdges = [];
let currentNode = "start";
let travelling = false;
let maskData;
let resizeTimer;
let avatarFoot = { x: 0, y: 0 };
let introDone = false;
const MAP_POSITION_KEY = "ishika-cloud-map-position";

function savedWorld() {
  try {
    const saved = sessionStorage.getItem(MAP_POSITION_KEY);
    return ["graphic-design", "about-me", "ux-design"].includes(saved) ? saved : "start";
  } catch (_) {
    return "start";
  }
}

function rememberWorld(world) {
  try { sessionStorage.setItem(MAP_POSITION_KEY, world); } catch (_) { /* storage is optional */ }
}

function getUnit() {
  return portraitQuery.matches
    ? window.innerWidth / 400
    : Math.min(window.innerWidth / 1486, window.innerHeight / 1058);
}

const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
};

async function sampleCloudMask() {
  // Keep this independent of canvas pixel reads so the downloaded site works
  // from a local folder as well as from GitHub Pages. Local-file browser
  // security can block getImageData(), which previously prevented every map
  // animation from starting.
  const width = 340;
  const height = 86;
  const labels = new Int32Array(width * height);
  labels.fill(1);
  maskData = { width, height, labels, largestLabel: 1 };
}

function outlinePoint(side, t) {
  const { width, height, labels, largestLabel } = maskData;
  const hit = (x, y) => labels[y * width + x] === largestLabel;
  if (side === "left" || side === "right") {
    const y = Math.max(0, Math.min(height - 1, Math.round(t * (height - 1))));
    if (side === "left") for (let x = 0; x < width; x++) if (hit(x, y)) return [x / width, y / height];
    for (let x = width - 1; x >= 0; x--) if (hit(x, y)) return [x / width, y / height];
  } else {
    const x = Math.max(0, Math.min(width - 1, Math.round(t * (width - 1))));
    if (side === "top") for (let y = 0; y < height; y++) if (hit(x, y)) return [x / width, y / height];
    for (let y = height - 1; y >= 0; y--) if (hit(x, y)) return [x / width, y / height];
  }
  return [.5, .5];
}

function placeAnchors() {
  const unit = getUnit();
  const pipe = document.querySelector(".pipe").getBoundingClientRect();
  document.querySelectorAll(".anchor").forEach((anchor) => {
    const side = anchor.dataset.side;
    const cloud = anchor.closest(".cloud");
    const rect = cloud.getBoundingClientRect();
    let t = Number(anchor.dataset.t);
    // The start cloud's landing spot always sits directly under the pipe mouth.
    if (anchor.dataset.follow === "pipe") t = (pipe.left + pipe.width / 2 - rect.left) / rect.width;
    // data-t/side describe the on-screen cloud, so sample the source mask from the opposite side when it's flipped.
    const mirrored = Boolean(cloud.querySelector(".cloud-image.mirrored"));
    let sampleSide = side;
    if (mirrored) {
      if (side === "left") sampleSide = "right";
      else if (side === "right") sampleSide = "left";
      else t = 1 - t;
    }
    let [x, y] = outlinePoint(sampleSide, t);
    if (mirrored) x = 1 - x;
    // Keep the rope centre just beneath the sampled alpha edge so its round
    // end and knot overlap the cloud silhouette instead of stopping short.
    const inset = Number(anchor.dataset.inset || 11.5) * unit;
    const dx = side === "left" ? inset : side === "right" ? -inset : 0;
    const dy = side === "top" ? inset : side === "bottom" ? -inset : 0;
    anchor.style.left = `${x * 100 + dx / rect.width * 100}%`;
    anchor.style.top = `${y * 100 + dy / rect.height * 100}%`;
  });
}

function anchorPosition(name) {
  const anchor = document.querySelector(`[data-anchor="${name}"]`);
  const rect = anchor.getBoundingClientRect();
  const mapRect = map.getBoundingClientRect();
  return { x: rect.left - mapRect.left, y: rect.top - mapRect.top };
}

function roundedPath(points, radius) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1];
    const current = points[i];
    const after = points[i + 1];
    const incoming = Math.hypot(current.x - before.x, current.y - before.y);
    const outgoing = Math.hypot(after.x - current.x, after.y - current.y);
    const r = Math.min(radius, incoming / 2, outgoing / 2);
    const p1 = {
      x: current.x + (before.x - current.x) / incoming * r,
      y: current.y + (before.y - current.y) / incoming * r,
    };
    const p2 = {
      x: current.x + (after.x - current.x) / outgoing * r,
      y: current.y + (after.y - current.y) / outgoing * r,
    };
    d += ` L ${p1.x} ${p1.y} Q ${current.x} ${current.y} ${p2.x} ${p2.y}`;
  }
  const last = points.at(-1);
  return `${d} L ${last.x} ${last.y}`;
}

function edgePath(edge, unit) {
  const a = anchorPosition(edge.from);
  const b = anchorPosition(edge.to);
  let points;
  if (edge.shape === "hvh") {
    const mid = (a.x + b.x) / 2;
    points = [a, { x: mid, y: a.y }, { x: mid, y: b.y }, b];
  } else if (edge.shape === "hv") {
    points = [a, { x: b.x, y: a.y }, b];
  } else {
    points = [a, { x: a.x, y: b.y }, b];
  }
  return { d: roundedPath(points, 46 * unit), a, b };
}

function addRope(pathData, id, unit) {
  const group = svgEl("g");
  const strokes = [
    ["rgba(14,40,12,.32)", 17, "", 1, `translate(0 ${3 * unit})`],
    ["#2a4414", 16.4],
    ["#4f7a22", 13.2],
    ["#76a23a", 7.4, "", .5],
    ["#2f4f19", 12.6, "1.4 2.2", .5],
    ["#a3c85c", 12, ".9 4", .38],
    ["rgba(58,44,10,.55)", 4.8, "9.5 7.5"],
    ["#f6e7ad", 3.2, "9.5 7.5"],
  ];
  strokes.forEach(([stroke, width, dash = "", opacity = 1, transform = ""]) => {
    const path = svgEl("path", {
      d: pathData.d,
      fill: "none",
      stroke,
      "stroke-width": Number(width) * unit,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      opacity,
      transform,
      ...(dash ? { "stroke-dasharray": dash.split(" ").map(Number).map((n) => n * unit).join(" ") } : {}),
    });
    if (stroke === "#4f7a22") {
      path.id = `route-${id}`;
      path.dataset.edge = id;
    }
    group.append(path);
  });
  routeSvg.append(group);
}

function addKnot(point, unit) {
  const group = svgEl("g", { transform: `translate(${point.x} ${point.y})`, filter: "drop-shadow(0 3px 3px rgba(24,46,14,.35))" });
  const radius = 12.8 * unit;
  group.append(svgEl("circle", { r: radius, fill: "url(#knot-gradient)", stroke: "#294615", "stroke-width": 2 * unit }));
  group.append(svgEl("circle", { r: radius * .74, fill: "none", stroke: "#365b1d", "stroke-width": 1.5 * unit, "stroke-dasharray": `${2.7 * unit} ${2.2 * unit}` }));
  group.append(svgEl("circle", { r: radius * .44, fill: "none", stroke: "#b7d371", "stroke-width": 1.3 * unit, "stroke-dasharray": `${2 * unit} ${1.8 * unit}` }));
  group.append(svgEl("circle", { r: 2.7 * unit, fill: "#f0c35a", stroke: "#936b20", "stroke-width": unit }));
  group.append(svgEl("path", { d: `M ${-radius * .7} ${-radius * .12} A ${radius * .7} ${radius * .7} 0 0 1 ${-radius * .1} ${-radius * .72}`, fill: "none", stroke: "rgba(255,255,255,.55)", "stroke-width": 1.5 * unit, "stroke-linecap": "round" }));
  knotSvg.append(group);
}

function drawRoutes() {
  placeAnchors();
  routeSvg.replaceChildren();
  knotSvg.replaceChildren();
  const unit = getUnit();
  const defs = svgEl("defs");
  const gradient = svgEl("radialGradient", { id: "knot-gradient", cx: "35%", cy: "28%" });
  [["0%", "#a3c258"], ["58%", "#628d2b"], ["100%", "#34531a"]].forEach(([offset, color]) => gradient.append(svgEl("stop", { offset, "stop-color": color })));
  defs.append(gradient);
  knotSvg.append(defs);
  activeEdges = portraitQuery.matches ? portraitEdges : landscapeEdges;
  const knots = new Map();
  activeEdges.forEach((edge) => {
    const pathData = edgePath(edge, unit);
    addRope(pathData, edge.id, unit);
    knots.set(`${pathData.a.x.toFixed(1)}-${pathData.a.y.toFixed(1)}`, pathData.a);
    knots.set(`${pathData.b.x.toFixed(1)}-${pathData.b.y.toFixed(1)}`, pathData.b);
  });
  knots.forEach((point) => addKnot(point, unit));
}

function setAvatarAt(point, hop = 0, scale = 1) {
  const width = avatar.offsetWidth;
  const height = avatar.offsetHeight;
  avatarFoot = { x: point.x, y: point.y };
  avatar.style.transform = `translate(${point.x - width / 2}px, ${point.y - height - hop}px) scale(${scale})`;
}

function standingPoint(node) {
  const prefix = { start: "start", "graphic-design": "graphic", "about-me": "about", "ux-design": "ux" }[node];
  return anchorPosition(`${prefix}-stand`);
}

function positionIntro() {
  const unit = getUnit();
  const m = map.getBoundingClientRect();
  const avatarWidth = avatar.offsetWidth;
  const avatarHeight = avatar.offsetHeight;
  const avatarRight = avatarFoot.x + avatarWidth / 2;
  const avatarTop = avatarFoot.y - avatarHeight;
  const width = intro.offsetWidth;
  const height = intro.offsetHeight;
  // Sit just off the avatar's top-right corner, with the tail pointing back at her head.
  let left = avatarRight - 8 * unit;
  let top = avatarTop + avatarHeight * 0.3 - height;
  left = Math.min(left, m.width - 16 - width);
  top = Math.max(top, 8);
  intro.style.left = `${left}px`;
  intro.style.top = `${top}px`;
}

function showIntro() {
  positionIntro();
  intro.classList.add("visible");
}

function initialDrop() {
  avatar.style.visibility = "visible";
  const target = standingPoint("start");
  if (reducedMotion.matches) {
    setAvatarAt(target);
    introDone = true;
    showIntro();
    return;
  }
  const pipe = document.querySelector(".pipe").getBoundingClientRect();
  const mapRect = map.getBoundingClientRect();
  const start = { x: pipe.left - mapRect.left + pipe.width / 2, y: pipe.bottom - mapRect.top - pipe.height * .02 };
  setAvatarAt(start);
  const started = performance.now();
  const fall = 1050;
  const bounce = 460;
  function frame(now) {
    const elapsed = now - started;
    if (elapsed < fall) {
      const t = elapsed / fall;
      const eased = t * t;
      setAvatarAt({ x: start.x + (target.x - start.x) * eased, y: start.y + (target.y - start.y) * eased }, 0, 1 - Math.sin(t * Math.PI) * .03);
      requestAnimationFrame(frame);
    } else if (elapsed < fall + bounce) {
      const t = (elapsed - fall) / bounce;
      const hop = Math.sin(t * Math.PI) * 20 * getUnit();
      const squash = t < .18 ? 1 - Math.sin(t / .18 * Math.PI) * .08 : 1;
      setAvatarAt(target, hop, squash);
      requestAnimationFrame(frame);
    } else {
      setAvatarAt(target);
      introDone = true;
      setTimeout(showIntro, 150);
    }
  }
  requestAnimationFrame(frame);
}

function findJourney(from, to) {
  const queue = [[from, []]];
  const visited = new Set([from]);
  while (queue.length) {
    const [node, journey] = queue.shift();
    if (node === to) return journey;
    activeEdges.forEach((edge) => {
      const next = edge.a === node ? edge.b : edge.b === node ? edge.a : null;
      if (!next || visited.has(next)) return;
      visited.add(next);
      queue.push([next, [...journey, { edge, reverse: edge.b === node }]]);
    });
  }
  return [];
}

function lineSamples(a, b, spacing = 6) {
  const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing));
  return Array.from({ length: steps }, (_, i) => ({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }));
}

function sampleJourney(journey, from, to) {
  const points = [];
  journey.forEach(({ edge, reverse }) => {
    const path = document.querySelector(`#route-${edge.id}`);
    const length = path.getTotalLength();
    const steps = Math.max(12, Math.ceil(length / 8));
    for (let i = 0; i <= steps; i++) {
      const distance = (reverse ? 1 - i / steps : i / steps) * length;
      points.push(path.getPointAtLength(distance));
    }
  });
  if (!points.length) return points;
  // Step from her current spot onto the rope, then off the rope's end onto the open part of the target cloud.
  return [...lineSamples(from, points[0]), ...points, ...lineSamples(points.at(-1), to), to];
}

function enterWorld(target) {
  currentNode = target;
  rememberWorld(target);
  navigateWithTransition(document.getElementById(target).href);
}

async function travelTo(target) {
  if (travelling) return;
  // Before the intro finishes, or if she's already there, go straight in.
  if (!introDone || !maskData || target === currentNode) {
    document.getElementById(target).classList.add("selected");
    enterWorld(target);
    return;
  }
  travelling = true;
  intro.classList.remove("visible");
  worlds.forEach((world) => world.classList.remove("selected"));
  const journey = findJourney(currentNode, target);
  const points = sampleJourney(journey, standingPoint(currentNode), standingPoint(target));
  if (!points.length) {
    travelling = false;
    enterWorld(target);
    return;
  }
  if (reducedMotion.matches) {
    setAvatarAt(standingPoint(target));
  } else {
    const distances = [0];
    for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    const total = distances.at(-1);
    const duration = Math.min(2600, Math.max(900, total * 2.3));
    const started = performance.now();
    await new Promise((resolve) => {
      function frame(now) {
        const raw = Math.min(1, (now - started) / duration);
        const eased = raw < .5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
        const at = eased * total;
        let index = distances.findIndex((distance) => distance >= at);
        if (index < 1) index = 1;
        const segment = (at - distances[index - 1]) / Math.max(1, distances[index] - distances[index - 1]);
        const point = {
          x: points[index - 1].x + (points[index].x - points[index - 1].x) * segment,
          y: points[index - 1].y + (points[index].y - points[index - 1].y) * segment,
        };
        const hop = Math.abs(Math.sin(at / 18)) * 5 * getUnit();
        setAvatarAt(point, hop);
        if (raw < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    const landing = standingPoint(target);
    const unit = getUnit();
    const bounceStart = performance.now();
    await new Promise((resolve) => {
      function bounce(now) {
        const t = Math.min(1, (now - bounceStart) / 420);
        setAvatarAt(landing, Math.sin(t * Math.PI) * 14 * unit, 1 - Math.sin(Math.min(1, t * 4) * Math.PI) * .06);
        if (t < 1) requestAnimationFrame(bounce);
        else resolve();
      }
      requestAnimationFrame(bounce);
    });
  }
  setAvatarAt(standingPoint(target));
  currentNode = target;
  document.getElementById(target).classList.add("selected");
  travelling = false;
  enterWorld(target);
}

worlds.forEach((world) => world.addEventListener("click", (event) => {
  // Let modified clicks (new tab, etc.) behave like normal links.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  if (travelling) return;
  travelTo(world.id).catch(() => {
    // Animation problems must never block navigation.
    travelling = false;
    enterWorld(world.id);
  });
}));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || travelling) return;
  worlds.forEach((world) => world.classList.remove("selected"));
});

function refresh() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawRoutes();
    if (avatar.style.visibility === "visible") setAvatarAt(standingPoint(currentNode));
    if (intro.classList.contains("visible")) positionIntro();
  }, 80);
}

window.addEventListener("resize", refresh);
window.addEventListener("orientationchange", refresh);
portraitQuery.addEventListener("change", refresh);

window.addEventListener("load", async () => {
  try {
    await sampleCloudMask();
    drawRoutes();
    const previousWorld = savedWorld();
    if (previousWorld !== "start") {
      currentNode = previousWorld;
      avatar.style.visibility = "visible";
      setAvatarAt(standingPoint(previousWorld));
      introDone = true;
      showIntro();
    } else {
      setTimeout(initialDrop, reducedMotion.matches ? 0 : 800);
    }
  } catch (error) {
    // Keep every world reachable if an image ever fails to decode.
    console.warn("Map artwork could not be sampled; using the direct entry fallback.", error);
    avatar.style.visibility = "visible";
    setAvatarAt(standingPoint("start"));
    introDone = true;
    showIntro();
  }
});
