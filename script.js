document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
    });
  }

  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) { header.classList.add('scrolled'); } 
    else { header.classList.remove('scrolled'); }
  });

  const revealElements = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < windowHeight - 150) { element.classList.add('active'); }
    });
  };
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();

  const heroImage = document.querySelector('.hero-image');
  if (heroImage && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', event => {
      const x = (event.clientX / window.innerWidth - 0.5) * 10;
      const y = (event.clientY / window.innerHeight - 0.5) * 10;
      heroImage.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.04)`;
    });
  }

  const isGreek = document.documentElement.lang === 'el';
  const t = isGreek
    ? { close: 'Κλείσιμο', prev: 'Προηγούμενη', next: 'Επόμενη', photos: 'φωτογραφίες' }
    : { close: 'Close', prev: 'Previous', next: 'Next', photos: 'photos' };

  const createDialog = (className, inner) => {
    const el = document.createElement('div');
    el.className = className;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = inner;
    document.body.appendChild(el);
    return el;
  };

  const categoryCards = Array.from(document.querySelectorAll('.category-card[data-slug]'));
  if (!categoryCards.length) return;

  const folder = createDialog('folder-view', `
    <div class="folder-panel">
      <div class="folder-head">
        <div><p class="eyebrow folder-count"></p><h2 class="folder-title"></h2></div>
        <button class="folder-close" type="button" aria-label="${t.close}">×</button>
      </div>
      <div class="folder-grid"></div>
    </div>
  `);
  const folderTitle = folder.querySelector('.folder-title');
  const folderCount = folder.querySelector('.folder-count');
  const folderGrid = folder.querySelector('.folder-grid');
  const folderClose = folder.querySelector('.folder-close');

  const lightbox = createDialog('lightbox', `
    <div class="lightbox-panel">
      <button class="lightbox-close" type="button" aria-label="${t.close}">×</button>
      <button class="lightbox-prev" type="button" aria-label="${t.prev}">‹</button>
      <img alt="">
      <button class="lightbox-next" type="button" aria-label="${t.next}">›</button>
      <p class="lightbox-caption"></p>
    </div>
  `);
  const lightboxImg = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const closeButton = lightbox.querySelector('.lightbox-close');

  let photos = [];
  let activeIndex = 0;
  let activeCard = null;

  const showPhoto = index => {
    activeIndex = (index + photos.length) % photos.length;
    const photo = photos[activeIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt;
    lightboxCaption.textContent = `${photo.alt} · ${activeIndex + 1} / ${photos.length}`;
  };

  const openLightbox = index => {
    showPhoto(index);
    lightbox.classList.add('active');
    closeButton.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    folderGrid.children[activeIndex]?.focus({ preventScroll: true });
  };

  const openFolder = card => {
    activeCard = card;
    const { slug, count, base } = card.dataset;
    const title = card.querySelector('h3').textContent;
    photos = Array.from({ length: Number(count) }, (_, i) => {
      const file = String(i + 1).padStart(3, '0') + '.jpg';
      return { src: `${base}${slug}/${file}`, thumb: `${base}${slug}/thumbs/${file}`, alt: title };
    });
    folderTitle.textContent = title;
    folderCount.textContent = `${count} ${t.photos}`;
    folderGrid.innerHTML = '';
    photos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'folder-thumb';
      button.innerHTML = `<img loading="lazy" src="${photo.thumb}" alt="${photo.alt} ${index + 1}">`;
      button.addEventListener('click', () => openLightbox(index));
      folderGrid.appendChild(button);
    });
    folder.scrollTop = 0;
    folder.classList.add('active');
    document.body.classList.add('is-lightbox-open');
    folderClose.focus({ preventScroll: true });
  };

  const closeFolder = () => {
    folder.classList.remove('active');
    document.body.classList.remove('is-lightbox-open');
    activeCard?.focus({ preventScroll: true });
  };

  categoryCards.forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => openFolder(card));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openFolder(card);
      }
    });
  });

  folderClose.addEventListener('click', closeFolder);
  folder.addEventListener('click', event => {
    if (event.target === folder) closeFolder();
  });
  closeButton.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(activeIndex + 1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (lightbox.classList.contains('active')) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPhoto(activeIndex - 1);
      if (event.key === 'ArrowRight') showPhoto(activeIndex + 1);
    } else if (folder.classList.contains('active') && event.key === 'Escape') {
      closeFolder();
    }
  });
});
