document.addEventListener('DOMContentLoaded', () => {
  // === Element References ===
  const loginBtn     = document.getElementById('login-btn');
  const logoutBtn    = document.getElementById('logout-btn');
  const newsletterForm = document.querySelector('form[name="newsletter"]');
  const modalOverlay = document.getElementById('newsletter-modal');
  const modalClose   = document.getElementById('modal-close');
  const slideBanner  = document.getElementById('slide-banner');
  const slideClose   = document.getElementById('slide-close');
  const slideSub     = document.getElementById('slide-subscribe');
  const backBtn      = document.getElementById('back-to-top');
  const videos       = Array.from(document.querySelectorAll('.responsive-video'));
  const blobs        = Array.from(document.querySelectorAll('.blob'));
  const themeToggles = Array.from(document.querySelectorAll('.theme-toggle'));
  const blogContainer= document.getElementById('blog-container');
  const filterBtns   = Array.from(document.querySelectorAll('.category-filters .filter-btn'));
  const searchInput  = document.getElementById('blog-search');

  // === Auth0 Login/Logout ===
  let auth0Client = null;
  if (loginBtn && logoutBtn) {
    (async () => {
      auth0Client = await createAuth0Client({
        domain: 'dev-v7ghdmwop17escip.us.auth0.com',
        client_id: 'LbPJW2aYXZe9OlssGooPOmzMQHjzNMUU'
      });
      if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, '/index.html');
      }
      const isAuth = await auth0Client.isAuthenticated();
      loginBtn.hidden  = isAuth;
      logoutBtn.hidden = !isAuth;
    })();
    loginBtn.addEventListener('click', () =>
      auth0Client.loginWithRedirect({ redirect_uri: window.location.origin + '/index.html' })
    );
    logoutBtn.addEventListener('click', () =>
      auth0Client.logout({ returnTo: window.location.origin + '/index.html' })
    );
  }

  // === Newsletter Form ===
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

  // === Exit-Intent Modal (Desktop only once) ===
  let exitModalShown = localStorage.getItem('exitModalShown') === 'true';
  if (modalOverlay && modalClose && window.innerWidth >= 768 && !exitModalShown) {
    document.addEventListener('mouseout', e => {
      if (e.clientY < 10) {
        modalOverlay.classList.add('show');
        exitModalShown = true;
        localStorage.setItem('exitModalShown', 'true');
      }
    });
    modalClose.addEventListener('click', () => modalOverlay.classList.remove('show'));
  }

  // === Slide-In Banner (After scroll once) ===
  let slideBannerShown = localStorage.getItem('slideBannerShown') === 'true';
  if (slideBanner && slideClose && slideSub) {
    slideClose.addEventListener('click', () => slideBanner.classList.remove('show'));
    slideSub.addEventListener('click', () => {
      if (modalOverlay) modalOverlay.classList.add('show');
      slideBanner.classList.remove('show');
    });
  }

  // === Theme Toggle ===
  themeToggles.forEach(btn => {
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

  // === Blog Loader & Filters (eat.html) ===
  if (blogContainer) {
    loadBlogPosts();
  }

  // === Back-to-Top Button ===
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // === Unified Scroll Listener ===
  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    // Slide banner trigger
    if (slideBanner && !slideBannerShown && y > window.innerHeight / 2) {
      slideBanner.classList.add('show');
      slideBannerShown = true;
      localStorage.setItem('slideBannerShown', 'true');
    }

    // Back-to-top visibility
    if (backBtn) backBtn.hidden = y < window.innerHeight;

    // Sticky mini-player
    videos.forEach(video => {
      const trigger = video.offsetTop + video.offsetHeight;
      video.classList.toggle('mini-player', y > trigger);
    });
  });

  // === Cursor & Gyroscope ===
  if (blobs.length) {
    document.addEventListener('mousemove', e => {
      blobs[0].style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(0,255,255,0.1), transparent)`;
    });
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', evt => {
        blobs.forEach((b,i) => {
          const x = evt.gamma || 0;
          b.style.transform = `translate(${x*(i+1)/50}px,0)`;
        });
      });
    }
  }

  // === Blog Loading Function ===
  async function loadBlogPosts() {
    blogContainer.innerHTML = '<p class="loading">Loading posts...</p>';
    try {
      const resp = await fetch('https://api.sheetbest.com/sheets/c67498d8-b750-4fe0-bebd-6756e85c469a');
      const posts = await resp.json();
      const today = new Date();
      const cats = { Virginia: [], 'Theme Parks': [], Abroad: [] };
      posts.forEach(p => {
        const d = new Date(p.Date);
        if (d <= today && cats[p.Category]) cats[p.Category].push(p);
      });
      blogContainer.innerHTML = '';
      Object.entries(cats).forEach(([cat, arr]) => {
        if (!arr.length) return;
        arr.sort((a,b) => new Date(b.Date) - new Date(a.Date));
        const sec = document.createElement('section');
        sec.className = 'blog-category';
        sec.innerHTML = `<h3>${cat}</h3>`;
        arr.forEach(post => {
          const card = document.createElement('div');
          card.className = 'blog-card';
          card.dataset.category = post.Category;
          card.innerHTML = `
            <img src="${post['Image URL']}" alt="${post.Title}" class="blog-image" loading="lazy"/>
            <h4>${post.Title}</h4>
            <p>${post.Summary}</p>
            <p><strong>${post.Rating}</strong></p>
            <a href="post.html?id=${encodeURIComponent(post.Title)}" class="expand-btn">Read More</a>`;
          sec.appendChild(card);
        });
        blogContainer.appendChild(sec);
      });
      // Apply filters
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
      // Apply search
      if (searchInput) {
        searchInput.addEventListener('input', e => {
          const term = e.target.value.trim().toLowerCase();
          document.querySelectorAll('.blog-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(term) ? '' : 'none';
          });
        });
      }
    } catch (err) {
      console.error(err);
      blogContainer.innerHTML = '<p class="loading">Failed to load posts.</p>';
    }
  }
});
