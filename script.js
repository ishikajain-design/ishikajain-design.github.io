const plant = document.querySelector('.plant');
const leaves = [...document.querySelectorAll('.leaf-link')];

leaves.forEach((leaf, index) => {
  const key = leaf.classList.contains('leaf-link--about') ? 'about' : leaf.classList.contains('leaf-link--ux') ? 'ux' : 'graphic';
  leaf.addEventListener('mouseenter', () => plant.dataset.active = key);
  leaf.addEventListener('focus', () => plant.dataset.active = key);
  leaf.addEventListener('mouseleave', () => delete plant.dataset.active);
  leaf.addEventListener('blur', () => delete plant.dataset.active);
});

window.addEventListener('load', () => {
  leaves.forEach((leaf, index) => {
    const start = 600 + index * 1050;
    window.setTimeout(() => leaf.classList.add('tour'), start);
    window.setTimeout(() => leaf.classList.remove('tour'), start + 900);
  });
});
