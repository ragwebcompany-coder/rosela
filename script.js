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

  const roomPhotos = Array.from(document.querySelectorAll('.room-photo'));
  if (roomPhotos.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = `
      <div class="lightbox-panel">
        <button class="lightbox-close" type="button" aria-label="Close">×</button>
        <button class="lightbox-prev" type="button" aria-label="Previous">‹</button>
        <img alt="">
        <button class="lightbox-next" type="button" aria-label="Next">›</button>
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const closeButton = lightbox.querySelector('.lightbox-close');
    const prevButton = lightbox.querySelector('.lightbox-prev');
    const nextButton = lightbox.querySelector('.lightbox-next');
    let activeIndex = 0;

    const showPhoto = index => {
      activeIndex = (index + roomPhotos.length) % roomPhotos.length;
      const photo = roomPhotos[activeIndex];
      const img = photo.querySelector('img');
      const caption = photo.querySelector('figcaption');
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = caption ? caption.textContent : img.alt;
    };

    const openLightbox = index => {
      showPhoto(index);
      lightbox.classList.add('active');
      document.body.classList.add('is-lightbox-open');
      closeButton.focus({ preventScroll: true });
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.classList.remove('is-lightbox-open');
      roomPhotos[activeIndex].focus?.({ preventScroll: true });
    };

    roomPhotos.forEach((photo, index) => {
      photo.tabIndex = 0;
      photo.addEventListener('click', () => openLightbox(index));
      photo.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(index);
        }
      });

      if (window.matchMedia('(pointer: fine)').matches) {
        photo.addEventListener('mousemove', event => {
          const rect = photo.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          photo.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
          photo.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
        });
        photo.addEventListener('mouseleave', () => {
          photo.style.setProperty('--tilt-x', '0deg');
          photo.style.setProperty('--tilt-y', '0deg');
        });
      }
    });

    closeButton.addEventListener('click', closeLightbox);
    prevButton.addEventListener('click', () => showPhoto(activeIndex - 1));
    nextButton.addEventListener('click', () => showPhoto(activeIndex + 1));
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('active')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPhoto(activeIndex - 1);
      if (event.key === 'ArrowRight') showPhoto(activeIndex + 1);
    });
  }
});
