document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const contactsMarkup = `
  <nav class="inner-cloud-utilities" aria-label="Contact and résumé">
    <a class="utility-cloud" href="https://www.linkedin.com/in/ishika-jain-973686215/" target="_blank" rel="noreferrer" aria-label="Visit Ishika Jain on LinkedIn"><span aria-hidden="true">in</span></a>
    <a class="utility-cloud" href="mailto:ijain04@calpoly.edu" aria-label="Email Ishika Jain"><span aria-hidden="true">✉</span></a>
    <a class="utility-cloud" href="resume.pdf" target="_blank" rel="noreferrer" aria-label="View Ishika Jain's résumé"><span aria-hidden="true">◉</span></a>
  </nav>`;

const innerUtilityMarkup = `
  <a class="utility-link" href="https://www.linkedin.com/in/ishika-jain-973686215/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 8.1V19H2.8V8.1h3.6ZM4.6 2.7a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM12.2 8.1v1.5h.1c.5-.9 1.8-1.9 3.7-1.9 3.9 0 4.7 2.6 4.7 6V19h-3.6v-4.7c0-1.1 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V19H9.2V8.1h3Z"/></svg><span class="tooltip">LinkedIn</span></a>
  <a class="utility-link" href="mailto:ijain04@calpoly.edu" aria-label="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h17A2.5 2.5 0 0 1 23 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 1 16.5v-9A2.5 2.5 0 0 1 3.5 5Zm8.5 7.2 7.5-4.5h-15l7.5 4.5Zm0 2.4L3.4 9.5v7h17v-7L12 14.6Z"/></svg><span class="tooltip">Email</span></a>
  <a class="utility-link" href="resume.pdf" target="_blank" rel="noreferrer" aria-label="View résumé"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.4 0 9.4 4.3 10.6 6.3a1.4 1.4 0 0 1 0 1.4C21.4 14.7 17.4 19 12 19S2.6 14.7 1.4 12.7a1.4 1.4 0 0 1 0-1.4C2.6 9.3 6.6 5 12 5Zm0 2.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 2.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z"/></svg><span class="tooltip">View résumé</span></a>`;

function standardizeInnerUtilities() {
  document.querySelectorAll('.inner-utility-nav').forEach((nav) => {
    nav.innerHTML = innerUtilityMarkup;
  });
}

function addInnerPageUtilities() {
  document.querySelectorAll('.inner-page .site-header').forEach((header) => {
    if (!header.querySelector('.inner-cloud-utilities')) header.insertAdjacentHTML('beforeend', contactsMarkup);
  });
}

function createWorldLoader() {
  let loader = document.querySelector('.world-loader');
  if (loader) return loader;

  loader = document.createElement('section');
  loader.className = 'world-loader';
  loader.setAttribute('role', 'dialog');
  loader.setAttribute('aria-modal', 'true');
  loader.setAttribute('aria-label', 'Loading another world');
  loader.innerHTML = `
    <div class="world-loader__card">
      <div class="world-loader__cloud"><img src="assets/cloud-avatar-map.png" alt="" /></div>
      <p>Loading another world…</p>
      <small>Holding on to the yarn</small>
      <button type="button">Skip transition</button>
    </div>`;
  document.body.append(loader);
  return loader;
}

function visitAfterTransition(url) {
  if (reduceMotion) {
    window.location.assign(url);
    return;
  }

  const loader = createWorldLoader();
  const skip = loader.querySelector('button');
  let visited = false;
  const visit = () => {
    if (visited) return;
    visited = true;
    window.location.assign(url);
  };

  loader.classList.add('is-visible');
  skip.focus();
  skip.addEventListener('click', visit, { once: true });
  window.setTimeout(visit, 3000);
}

function setUpWorldFooters() {
  // World links now use the shared 3-second cloud transition in map-transition.js.
}

function animateAvatarTravel(avatar, destination, world) {
  const avatarBox = avatar.getBoundingClientRect();
  const targetBox = destination.getBoundingClientRect();
  const destinations = {
    graphic: [0.52, 0.44, -12],
    ux: [0.5, 0.42, 0],
    about: [0.48, 0.44, 12]
  };
  const [xRatio, yRatio, rotate] = destinations[world] || destinations.ux;
  const targetX = targetBox.left + targetBox.width * xRatio;
  const targetY = targetBox.top + targetBox.height * yRatio;
  const deltaX = targetX - (avatarBox.left + avatarBox.width / 2);
  const deltaY = targetY - (avatarBox.top + avatarBox.height / 2);
  const traveler = avatar.cloneNode(true);

  traveler.className = 'flying-avatar';
  traveler.setAttribute('aria-hidden', 'true');
  traveler.removeAttribute('alt');
  traveler.style.left = `${avatarBox.left}px`;
  traveler.style.top = `${avatarBox.top}px`;
  traveler.style.width = `${avatarBox.width}px`;
  traveler.style.height = `${avatarBox.height}px`;
  document.body.append(traveler);
  avatar.style.visibility = 'hidden';

  if (typeof traveler.animate === 'function') {
    traveler.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
        { offset: .52, transform: `translate(${deltaX * .52}px, ${deltaY * .28 - 34}px) rotate(${rotate / 2}deg) scale(1.08)` },
        { transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg) scale(.84)` }
      ],
      { duration: 940, easing: 'cubic-bezier(.2,.76,.24,1)', fill: 'forwards' }
    );
  } else {
    traveler.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
  }
}

function parseMapRect(value) {
  if (!value) return null;
  const values = value.split(',').map((part) => Number.parseFloat(part.trim()));
  return values.length === 4 && values.every(Number.isFinite) ? values : null;
}

function applyMapRect(element, sourceRect, scale, offsetX, offsetY) {
  if (!sourceRect) return;
  const [x, y, width, height] = sourceRect;
  element.style.left = `${offsetX + x * scale}px`;
  element.style.top = `${offsetY + y * scale}px`;
  element.style.width = `${width * scale}px`;
  element.style.height = `${height * scale}px`;
}

function applyLocalMapRect(element, sourceRect, scale) {
  if (!sourceRect) return;
  const [x, y, width, height] = sourceRect;
  element.style.left = `${x * scale}px`;
  element.style.top = `${y * scale}px`;
  element.style.width = `${width * scale}px`;
  element.style.height = `${height * scale}px`;
  element.style.setProperty('--label-title-size', `${Math.max(12, Math.min(26, 20 * scale))}px`);
  element.style.setProperty('--label-small-size', `${Math.max(5.5, Math.min(10, 7.5 * scale))}px`);
}

function layoutArtMap(home) {
  const canvas = home.querySelector('.art-map-canvas');
  if (!canvas) return;

  const viewport = canvas.getBoundingClientRect();
  if (!viewport.width || !viewport.height) return;

  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const source = mobile ? { width: 941, height: 1672, key: 'mobile' } : { width: 1672, height: 941, key: 'desktop' };
  const scale = Math.max(viewport.width / source.width, viewport.height / source.height);
  const renderedWidth = source.width * scale;
  const renderedHeight = source.height * scale;
  const offsetX = (viewport.width - renderedWidth) / 2;
  const offsetY = (viewport.height - renderedHeight) / 2;
  const rectAttribute = `data-${source.key}-rect`;
  const localAttribute = `data-${source.key}-local`;

  canvas.style.setProperty('--map-scale', String(scale));
  canvas.querySelectorAll(`[${rectAttribute}]`).forEach((element) => {
    applyMapRect(element, parseMapRect(element.getAttribute(rectAttribute)), scale, offsetX, offsetY);
  });
  canvas.querySelectorAll(`[${localAttribute}]`).forEach((element) => {
    applyLocalMapRect(element, parseMapRect(element.getAttribute(localAttribute)), scale);
  });

  const nativeUtilities = mobile || viewport.width / viewport.height > 1.9;
  canvas.dataset.nativeUtilities = nativeUtilities ? 'true' : 'false';

  if (nativeUtilities) {
    const size = Math.max(42, Math.min(68, viewport.width * (mobile ? 0.108 : 0.045)));
    const gap = Math.max(8, Math.min(15, size * 0.18));
    const edge = Math.max(16, viewport.width * 0.025);
    const top = Math.max(14, viewport.height * (mobile ? 0.014 : 0.027));
    const firstLeft = viewport.width - edge - size * 3 - gap * 2;

    canvas.querySelectorAll('.art-utility').forEach((utility, index) => {
      utility.style.left = `${firstLeft + index * (size + gap)}px`;
      utility.style.top = `${top}px`;
      utility.style.width = `${size}px`;
      utility.style.height = `${size * 0.74}px`;
    });
  }
}

function runWelcomeTour(nodes) {
  const tourKey = 'ishika-cloud-world-tour-seen';
  let seen = false;
  try { seen = localStorage.getItem(tourKey) === 'true'; } catch (_) { /* storage can be unavailable */ }
  if (seen || reduceMotion) return;

  nodes.forEach((node, index) => {
    const start = 2200 + index * 900;
    window.setTimeout(() => node.classList.add('is-touring'), start);
    window.setTimeout(() => node.classList.remove('is-touring'), start + 670);
  });
  try { localStorage.setItem(tourKey, 'true'); } catch (_) { /* keep the optional tour optional */ }
}

function setUpWorldMap() {
  const home = document.querySelector('[data-world-home]');
  if (!home) return;

  const avatar = home.querySelector('.world-avatar');
  const status = home.querySelector('.map-status');
  const nodes = [...home.querySelectorAll('.world-node[data-world]')];
  const skyDrift = home.querySelector('.sky-drift');
  const worldNames = { graphic: 'Graphic Design', ux: 'UX Design', about: 'About Me' };
  let traveling = false;

  if (skyDrift) {
    const updateSkyDriftVisibility = () => skyDrift.classList.toggle('is-paused', document.hidden);
    updateSkyDriftVisibility();
    document.addEventListener('visibilitychange', updateSkyDriftVisibility);
  }

  const layout = () => layoutArtMap(home);
  layout();
  window.requestAnimationFrame(layout);
  window.addEventListener('resize', layout, { passive: true });
  const mapImage = home.querySelector('.art-map-image img');
  if (mapImage && !mapImage.complete) mapImage.addEventListener('load', layout, { once: true });

  window.setTimeout(() => home.classList.add('is-ready'), 90);
  runWelcomeTour(nodes);

  nodes.forEach((node) => {
    node.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || traveling) return;
      if (reduceMotion) return;
      event.preventDefault();
      traveling = true;
      const world = node.dataset.world;
      home.classList.add('is-traveling');
      home.dataset.travel = world;
      node.classList.add('is-selected');
      status.textContent = `Travelling to ${worldNames[world]}.`;
      animateAvatarTravel(avatar, node, world);
      window.setTimeout(() => window.location.assign(node.href), 1100);
    });
  });
}

addInnerPageUtilities();
standardizeInnerUtilities();
setUpWorldFooters();
setUpWorldMap();
