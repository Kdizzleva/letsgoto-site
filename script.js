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

  // === Dynamic Blob Background & Mouse Parallax ===
  (function initBlobs() {
    const colors = ['var(--accent-pink)', 'var(--accent-blue)', 'var(--accent-yellow)'];
    const numBlobs = 8;
    const blobsArr = [];
    for (let i = 0; i < numBlobs; i++) {
      const b = document.createElement('div');
      b.classList.add('blob');
      const size = Math.random() * 200 + 100;
      b.style.width = b.style.height = `${size}px`;
      const color = colors[i % colors.length];
      b.style.background = color;
      b.dataset.baseColor = color;
      const tl = Math.random()*50+25, tr = Math.random()*50+25;
      const br = Math.random()*50+25, bl = Math.random()*50+25;
      b.style.borderRadius = `${tl}% ${tr}% ${br}% ${bl}% / ${bl}% ${br}% ${tr}% ${tl}%`;
      b.x = Math.random() * (window.innerWidth - size);
      b.y = Math.random() * (window.innerHeight - size);
      b.vx = (Math.random() * 2 - 1) * 0.5;
      b.vy = (Math.random() * 2 - 1) * 0.5;
      b.style.transform = `translate(${b.x}px,${b.y}px)`;
      document.body.appendChild(b);
      blobsArr.push(b);
    }

    let ticking = false;
    document.addEventListener('mousemove', e => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        blobsArr.forEach((b, i) => {
          b.x += b.vx; b.y += b.vy;
          const w = b.clientWidth, h = b.clientHeight;
          if (b.x < -w) b.x = window.innerWidth;
          if (b.x > window.innerWidth) b.x = -w;
          if (b.y < -h) b.y = window.innerHeight;
          if (b.y > window.innerHeight) b.y = -h;
          const speed = 0.0008 + i * 0.0001;
          const dx = (e.clientX - window.innerWidth/2) * speed;
          const dy = (e.clientY - window.innerHeight/2) * speed;
          b.style.transform = `translate(${b.x + dx}px,${b.y + dy}px)`;
        });
        ticking = false;
      });
      ticking = true;
    });

    // continuous drift loop
    (function drift() {
      blobsArr.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        b.style.transform = `translate(${b.x}px,${b.y}px)`;
        b.style.background = b.dataset.baseColor;
      });
      requestAnimationFrame(drift);
    })();
  })();

  // === CTA Ripple Effect ===
  (function initRipple() {
    const cta = document.querySelector('.hero-cta');
    if (!cta) return;
    cta.style.position = 'relative';
    cta.style.overflow = 'hidden';
    cta.addEventListener('click', e => {
      const circle = document.createElement('span');
      circle.classList.add('ripple');
      const d = Math.max(cta.clientWidth, cta.clientHeight);
      circle.style.width = circle.style.height = `${d}px`;
      const rect = cta.getBoundingClientRect();
      circle.style.left = `${e.clientX - rect.left - d/2}px`;
      circle.style.top = `${e.clientY - rect.top - d/2}px`;
      cta.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  })();

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
            <a href="post.html?id=${encodeURIComponent(post.UUID)}" class="expand-btn">Read More</a>`;
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
