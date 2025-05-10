document.addEventListener('DOMContentLoaded', () => {
  // --- Auth0 Login/Logout ---
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  let auth0 = null;
  if (loginBtn && logoutBtn) {
    (async () => {
      auth0 = await createAuth0Client({
        domain: 'dev-v7ghdmwop17escip.us.auth0.com',
        client_id: 'LbPJW2aYXZe9OlssGooPOmzMQHjzNMUU'
      });
      if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        await auth0.handleRedirectCallback();
        window.history.replaceState({}, document.title, '/index.html');
      }
      const isAuthenticated = await auth0.isAuthenticated();
      loginBtn.hidden  = isAuthenticated;
      logoutBtn.hidden = !isAuthenticated;
    })();
    loginBtn.addEventListener('click', () =>
      auth0.loginWithRedirect({ redirect_uri: window.location.origin + '/index.html' })
    );
    logoutBtn.addEventListener('click', () =>
      auth0.logout({ returnTo: window.location.origin + '/index.html' })
    );
  }

  // --- Newsletter Form Handling ---
  const newsletterForm = document.querySelector('form[name="newsletter"]');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const confirmation = newsletterForm.querySelector('.newsletter-confirmation');
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(newsletterForm)).toString()
      })
      .then(() => {
        confirmation.hidden = false;
        newsletterForm.reset();
      })
      .catch(() => {
        confirmation.textContent = 'Oops! Something went wrong.';
        confirmation.style.color = 'red';
        confirmation.hidden = false;
      });
    });
  }

  // --- Exit‑Intent Modal (Desktop only, once per session) ---
  let exitModalShown = localStorage.getItem('exitModalShown') === 'true';
  const modalOverlay = document.getElementById('newsletter-modal');
  const modalClose = document.getElementById('modal-close');
  if (window.innerWidth >= 768 && !exitModalShown && modalOverlay && modalClose) {
    document.addEventListener('mouseout', e => {
      if (e.clientY < 10) {
        modalOverlay.classList.add('show');
        exitModalShown = true;
        localStorage.setItem('exitModalShown', 'true');
      }
    });
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('show');
    });
  }

  // --- Slide‑In Banner (After scroll, once per session) ---
  let slideShown = localStorage.getItem('slideBannerShown') === 'true';
  const slideBanner = document.getElementById('slide-banner');
  const slideClose  = document.getElementById('slide-close');
  const slideSub    = document.getElementById('slide-subscribe');
  if (slideBanner && slideClose && slideSub) {
    window.addEventListener('scroll', () => {
      if (!slideShown && window.scrollY > window.innerHeight / 2) {
        slideBanner.classList.add('show');
        slideShown = true;
        localStorage.setItem('slideBannerShown', 'true');
      }
    });
    slideClose.addEventListener('click', () => slideBanner.classList.remove('show'));
    slideSub.addEventListener('click', () => {
      document.getElementById('newsletter-modal').classList.add('show');
      slideBanner.classList.remove('show');
    });
  }

  // --- Cursor / Gyroscope Interaction ---
  const blob1 = document.querySelector('.blob1');
  if (blob1) {
    document.addEventListener('mousemove', e => {
      blob1.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(0,255,255,0.1), transparent)`;
    });
  }
  if (window.DeviceOrientationEvent) {
    const blobs = document.querySelectorAll('.blob');
    window.addEventListener('deviceorientation', event => {
      blobs.forEach((b, i) => {
        const x = event.gamma || 0;
        b.style.transform = `translate(${x*(i+1)/50}px, 0)`;
      });
    });
  }

  // --- Theme Toggle ---
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    const body = document.body;
    if (localStorage.getItem('theme') === 'light') {
      body.classList.add('light-mode');
      btn.textContent = '🌑 Dark Mode';
    }
    btn.addEventListener('click', () => {
      const isLight = body.classList.toggle('light-mode');
      btn.textContent = isLight ? '🌑 Dark Mode' : '🌙 Light Mode';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  });

  // --- Blog Loading & Filters on eat.html ---
  if (window.location.pathname.includes('eat')) {
    const container = document.getElementById('blog-container');
    if (container) {
      container.innerHTML = '<p class="loading">Loading posts...</p>';
      fetch('https://api.sheetbest.com/sheets/c67498d8-b750-4fe0-bebd-6756e85c469a')
        .then(r => r.json())
        .then(posts => {
          const today = new Date();
          const cats = { Virginia: [], 'Theme Parks': [], Abroad: [] };
          posts.forEach(p => {
            const d = new Date(p.Date);
            if (d <= today && cats[p.Category]) cats[p.Category].push(p);
          });
          container.innerHTML = '';
          Object.entries(cats).forEach(([cat, arr]) => {
            if (!arr.length) return;
            arr.sort((a,b) => new Date(b.Date) - new Date(a.Date));
            const sec = document.createElement('section');
            sec.className = 'blog-category';
            const h = document.createElement('h3');
            h.textContent = cat; sec.appendChild(h);
            arr.forEach(post => {
              const card = document.createElement('div');
              card.className = 'blog-card';
              card.dataset.category = post.Category;
              card.innerHTML = `
                <img src="${post['Image URL']}" alt="${post.Title}" class="blog-image" loading="lazy"/>
                <h4>${post.Title}</h4><p>${post.Summary}</p>
                <p><strong>${post.Rating}</strong></p>
                <a href="post.html?id=${encodeURIComponent(post.Title)}" class="expand-btn">Read More</a>`;
              sec.appendChild(card);
            });
            container.appendChild(sec);
          });
          if (!container.querySelector('.blog-card')) {
            container.innerHTML = '<p class="loading">No posts available.</p>';
          }
          // Apply category filters and search
          const filterBtns = document.querySelectorAll('.category-filters .filter-btn');
          filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              filterBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              const f = btn.dataset.filter;
              document.querySelectorAll('.blog-card').forEach(card => {
                card.style.display = (f === 'All' || card.dataset.category === f) ? '' : 'none';
              });
            });
          });
          const searchInput = document.getElementById('blog-search');
          if (searchInput) {
            searchInput.addEventListener('input', e => {
              const term = e.target.value.trim().toLowerCase();
              document.querySelectorAll('.blog-card').forEach(card => {
                card.style.display = card.textContent.toLowerCase().includes(term) ? '' : 'none';
              });
            });
          }
        })
        .catch(err => {
          console.error(err);
          container.innerHTML = '<p class="loading">Failed to load posts.</p>';
        });
    }
    // Back-to-top button
    const backBtn = document.getElementById('back-to-top');
    if (backBtn) {
      window.addEventListener('scroll', () => {
        backBtn.hidden = window.scrollY < window.innerHeight;
      });
      backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // --- Sticky Mini-Player ---
  const videos = Array.from(document.querySelectorAll('.responsive-video'));
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    videos.forEach(video => {
      const triggerPoint = video.offsetTop + video.offsetHeight;
      video.classList.toggle('mini-player', scrollY > triggerPoint);
    });
  });
});
