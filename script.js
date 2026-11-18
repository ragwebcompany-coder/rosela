document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
    });
    navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.innerHTML = '☰';
      });
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
    ? { close: 'Κλείσιμο', prev: 'Προηγούμενη', next: 'Επόμενη', photos: 'φωτογραφίες', photo: 'φωτογραφία' }
    : { close: 'Close', prev: 'Previous', next: 'Next', photos: 'photos', photo: 'photo' };

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
  const galleries = Array.from(document.querySelectorAll('[data-gallery]'));
  if (!categoryCards.length && !galleries.length) return;

  // Lightbox (shared by the folder overlay and the in-page galleries)
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
  let returnTargets = [];
  let folder = null;

  const showPhoto = index => {
    activeIndex = (index + photos.length) % photos.length;
    const photo = photos[activeIndex];
    lightboxImg.src = photo.src;
    lightboxImg.alt = photo.alt;
    lightboxCaption.textContent = `${photo.alt} · ${activeIndex + 1} / ${photos.length}`;
  };

  const openLightbox = (list, index, targets) => {
    photos = list;
    returnTargets = targets;
    showPhoto(index);
    lightbox.classList.add('active');
    document.body.classList.add('is-lightbox-open');
    closeButton.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    if (!folder || !folder.classList.contains('active')) document.body.classList.remove('is-lightbox-open');
    returnTargets[activeIndex]?.focus({ preventScroll: true });
  };

  closeButton.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(activeIndex - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(activeIndex + 1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  // In-page galleries: plain links to the full photos, upgraded to the lightbox
  galleries.forEach(gallery => {
    const links = Array.from(gallery.querySelectorAll('a.folder-thumb'));
    const list = links.map(link => ({ src: link.href, alt: gallery.dataset.title }));
    links.forEach((link, index) => {
      link.addEventListener('click', event => {
        event.preventDefault();
        openLightbox(list, index, links);
      });
    });
  });

  // Folder overlay for the category cards
  let closeFolder = () => {};
  if (categoryCards.length) {
    folder = createDialog('folder-view', `
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
    let activeCard = null;

    const openFolder = card => {
      activeCard = card;
      const { slug, count, base } = card.dataset;
      const title = card.querySelector('h3').textContent;
      const list = Array.from({ length: Number(count) }, (_, i) => {
        const file = String(i + 1).padStart(3, '0') + '.jpg';
        return { src: `${base}${slug}/${file}`, thumb: `${base}${slug}/thumbs/${file}`, alt: title };
      });
      folderTitle.textContent = title;
      folderCount.textContent = `${count} ${Number(count) === 1 ? t.photo : t.photos}`;
      folderGrid.innerHTML = '';
      const buttons = list.map((photo, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'folder-thumb';
        button.innerHTML = `<img loading="lazy" src="${photo.thumb}" alt="${photo.alt} ${index + 1}">`;
        button.addEventListener('click', () => openLightbox(list, index, buttons));
        folderGrid.appendChild(button);
        return button;
      });
      folder.scrollTop = 0;
      folder.classList.add('active');
      document.body.classList.add('is-lightbox-open');
      folderClose.focus({ preventScroll: true });
    };

    closeFolder = () => {
      folder.classList.remove('active');
      document.body.classList.remove('is-lightbox-open');
      activeCard?.focus({ preventScroll: true });
    };

    categoryCards.forEach(card => {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
      card.addEventListener('click', event => {
        // Ctrl/Cmd/middle click on the title still opens the category page
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        openFolder(card);
      });
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
  }

  document.addEventListener('keydown', event => {
    if (lightbox.classList.contains('active')) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPhoto(activeIndex - 1);
      if (event.key === 'ArrowRight') showPhoto(activeIndex + 1);
    } else if (folder && folder.classList.contains('active') && event.key === 'Escape') {
      closeFolder();
    }
  });
});
