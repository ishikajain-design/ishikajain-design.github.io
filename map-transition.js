// Shared "Loading another world…" screen used when moving between worlds.
// Links opt in with `data-transition`; the map calls navigateWithTransition() directly.
const transitionReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const asset = (file) => `assets/${file}`;
const DURATION = 3000;

let overlay;
let timer;
let pendingUrl = null;

function buildOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.className = "world-transition";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "wt-title");
  overlay.innerHTML = `
    <img class="wt-sky" src="${asset("sky-background.jpg")}" alt="" />
    <img class="wt-puff" src="${asset("cloud-platform-wide.webp")}" alt="" />
    <img class="wt-puff" src="${asset("cloud-platform-wide.webp")}" alt="" />
    <img class="wt-puff" src="${asset("cloud-platform-wide.webp")}" alt="" />
    <div class="wt-rider" aria-hidden="true">
      <img class="wt-avatar" src="${asset("cloud-avatar-map.webp")}" alt="" />
      <img class="wt-cloud" src="${asset("cloud-platform-wide.webp")}" alt="" />
    </div>
    <p id="wt-title" class="wt-title" aria-live="polite">Loading world…</p>
    <div class="wt-progress" aria-hidden="true"><span></span></div>
    <button type="button" class="wt-skip">Skip Transition</button>`;
  overlay.querySelector(".wt-skip").addEventListener("click", go);
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") go();
  });
  document.body.append(overlay);
  return overlay;
}

function go() {
  clearTimeout(timer);
  if (pendingUrl) window.location.assign(pendingUrl);
}

function navigateWithTransition(url) {
  if (!url) return;
  if (transitionReducedMotion.matches) {
    window.location.assign(url);
    return;
  }
  pendingUrl = url;
  const el = buildOverlay();
  el.hidden = false;
  document.documentElement.classList.add("is-transitioning");
  requestAnimationFrame(() => el.classList.add("is-active"));
  el.querySelector(".wt-skip").focus({ preventScroll: true });
  clearTimeout(timer);
  timer = setTimeout(go, DURATION);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-transition]");
  if (!link || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;
  event.preventDefault();
  navigateWithTransition(link.href);
});

// Returning with the back button restores the page from cache; clear the overlay.
window.addEventListener("pageshow", () => {
  clearTimeout(timer);
  pendingUrl = null;
  document.documentElement.classList.remove("is-transitioning");
  if (overlay) {
    overlay.classList.remove("is-active");
    overlay.hidden = true;
  }
});
