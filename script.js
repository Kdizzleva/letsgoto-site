/* Global script for site */

// Cursor / gyroscope interaction
(function() {
  const bg = document.querySelector('.blob1');
  if (bg) {
    document.addEventListener('mousemove', e => {
      bg.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(0,255,255,0.1), transparent)`;
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
})();

// Theme toggle
(function() {
  const btn = document.querySelectorAll('.theme-toggle');
  btn.forEach(toggleBtn => {
    const body = document.body;
    if (localStorage.getItem('theme') === 'light') {
      body.classList.add('light-mode');
      toggleBtn.textContent = '🌑 Dark Mode';
    }
    toggleBtn.addEventListener('click', () => {
      const isLight = body.classList.toggle('light-mode');
      toggleBtn.textContent = isLight ? '🌑 Dark Mode' : '🌙 Light Mode';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  });
})();

// Blog loading on eat.html
(function() {
  if (!window.location.pathname.includes('eat')) return;
  const container = document.getElementById('blog-container');
  if (!container) return;
  container.innerHTML = '<p class="loading">Loading posts...</p>';
  fetch('https://api.sheetbest.com/sheets/c67498d8-b750-4fe0-bebd-6756e85c469a')
    .then(r => r.json())
    .then(posts => {
      const today = new Date();
      const categories = { Virginia: [], 'Theme Parks': [], Abroad: [] };
      posts.forEach(p => {
        const d = new Date(p.Date);
        if (d <= today && categories[p.Category]) categories[p.Category].push(p);
      });
      container.innerHTML = '';
      Object.entries(categories).forEach(([cat, arr]) => {
        if (!arr.length) return;
        // sort newest first
        arr.sort((a,b) => new Date(b.Date) - new Date(a.Date));
        const sec = document.createElement('section'); sec.className = 'blog-category';
        const h = document.createElement('h3'); h.textContent = cat; sec.appendChild(h);
        arr.forEach(post => {
          const card = document.createElement('div'); card.className = 'blog-card';
          card.innerHTML = `
            <img src="${post['Image URL']}" alt="${post.Title}" class="blog-image" loading="lazy" />
            <h4>${post.Title}</h4>
            <p>${post.Summary}</p>
            <p><strong>${post.Rating}</strong></p>
            <a href="post.html?id=${encodeURIComponent(post.Title)}" class="expand-btn">Read More</a>
          `;
          sec.appendChild(card);
        });
        container.appendChild(sec);
      });
      if (!container.querySelector('.blog-category')) {
        container.innerHTML = '<p class="loading">No posts available.</p>';
      }
    })
    .catch(err => { console.error(err); container.innerHTML = '<p class="loading">Failed to load posts.</p>'; });
})();

// Dynamic post page (post.html)
// Inline script in post.html handles fetching and rendering single post by URL id
