// ====================== script.js ======================

document.addEventListener("DOMContentLoaded", () => {
  // --- Auth0 Login/Logout ---
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  let auth0Client = null;

  // Only initialize Auth0 if both buttons exist
  if (loginBtn && logoutBtn) {
    (async () => {
      // Instantiate Auth0 client using your new domain & client ID
      auth0Client = await createAuth0Client({
        domain: "dev-v7ghdmwop17escip.us.auth0.com",
        client_id: "45cHhouSTtS3V5IAhYvHqP5TzqRFD61a",
        cacheLocation: "localstorage", // optional: persist login across refreshes
      });

      // Handle the redirect back from Auth0 (after login)
      if (
        window.location.search.includes("code=") &&
        window.location.search.includes("state=")
      ) {
        try {
          await auth0Client.handleRedirectCallback();
        } catch (err) {
          console.error("Error handling Auth0 redirect callback:", err);
        }
        // Remove query parameters from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check authentication state and show/hide buttons accordingly
      const isAuthenticated = await auth0Client.isAuthenticated();
      loginBtn.hidden = isAuthenticated;
      logoutBtn.hidden = !isAuthenticated;
    })();

    // When “Log In” is clicked, redirect to Auth0’s Universal Login page
    loginBtn.addEventListener("click", () => {
      auth0Client.loginWithRedirect({
        redirect_uri: window.location.origin + "/index.html",
      });
    });

    // When “Log Out” is clicked, log the user out and return to home
    logoutBtn.addEventListener("click", () => {
      auth0Client.logout({
        returnTo: window.location.origin + "/index.html",
      });
    });
  }

  // --- Theme Toggle (Light / Dark) ---
  const themeToggleBtns = document.querySelectorAll(".theme-toggle");
  themeToggleBtns.forEach((btn) => {
    const body = document.body;
    // Initialize on page load if user preference was “light”
    if (localStorage.getItem("theme") === "light") {
      body.classList.add("light-mode");
      btn.textContent = "🌑 Dark Mode";
    }
    btn.addEventListener("click", () => {
      const isLight = body.classList.toggle("light-mode");
      btn.textContent = isLight ? "🌑 Dark Mode" : "🌙 Light Mode";
      localStorage.setItem("theme", isLight ? "light" : "dark");
    });
  });

  // --- Animated Blobs (Mouse + Gyroscope) ---
  const blobs = document.querySelectorAll(".blob");
  // Mouse-based radial gradient for blob1
  const blob1 = document.querySelector(".blob1");
  if (blob1) {
    document.addEventListener("mousemove", (e) => {
      blob1.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(0,255,255,0.1), transparent)`;
    });
  }
  // Gyroscope movement for blobs (mobile)
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", (event) => {
      blobs.forEach((b, i) => {
        const xTilt = event.gamma || 0; // left/right tilt
        // Each blob moves a bit more than the previous
        b.style.transform = `translate(${xTilt * (i + 1) / 50}px, 0)`;
      });
    });
  }

  // --- Back-to-Top Button (only on eat.html) ---
  if (window.location.pathname.includes("eat")) {
    const backBtn = document.getElementById("back-to-top");
    if (backBtn) {
      window.addEventListener("scroll", () => {
        backBtn.hidden = window.scrollY < window.innerHeight;
      });
      backBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // --- Blog Posts Loading & Filtering (eat.html only) ---
  if (window.location.pathname.includes("eat")) {
    const container = document.getElementById("blog-container");
    if (container) {
      // Show a loading placeholder
      container.innerHTML = '<p class="loading">Loading posts...</p>';
      fetch("https://api.sheetbest.com/sheets/c67498d8-b750-4fe0-bebd-6756e85c469a")
        .then((res) => res.json())
        .then((posts) => {
          const today = new Date();
          // Group posts by category
          const categories = { Virginia: [], "Theme Parks": [], Abroad: [] };
          posts.forEach((p) => {
            const postDate = new Date(p.Date);
            const cat = p.Category;
            if (postDate <= today && categories[cat]) {
              categories[cat].push(p);
            }
          });

          container.innerHTML = "";
          Object.entries(categories).forEach(([catName, arr]) => {
            if (!arr.length) return;
            // Sort newest first
            arr.sort((a, b) => new Date(b.Date) - new Date(a.Date));
            const sectionEl = document.createElement("section");
            sectionEl.className = "blog-category";
            const heading = document.createElement("h3");
            heading.textContent = catName;
            heading.dataset.category = catName;
            sectionEl.appendChild(heading);

            arr.forEach((post) => {
              const card = document.createElement("div");
              card.className = "blog-card";
              card.dataset.category = post.Category;
              card.innerHTML = `
                <img src="${post["Image 1"]}" alt="${post.Title}" class="blog-image" loading="lazy" />
                <h4>${post.Title}</h4>
                <p>${post.Summary}</p>
                <p><strong>${post.Rating}</strong></p>
                <a href="post.html?id=${encodeURIComponent(post.UUID)}" class="expand-btn">Read More</a>
              `;
              sectionEl.appendChild(card);
            });

            container.appendChild(sectionEl);
          });

          if (!container.querySelector(".blog-card")) {
            container.innerHTML = "<p class=\"loading\">No posts available.</p>";
          }

          // Set up category filter buttons
          const filterBtns = document.querySelectorAll(".filter-btn");
          filterBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
              filterBtns.forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
              const filterName = btn.dataset.filter;
              document.querySelectorAll(".blog-card").forEach((card) => {
                card.style.display =
                  filterName === "All" || card.dataset.category === filterName
                    ? ""
                    : "none";
              });
            });
          });

          // Live Search input field
          const searchInput = document.getElementById("blog-search");
          if (searchInput) {
            searchInput.addEventListener("input", (e) => {
              const term = e.target.value.trim().toLowerCase();
              document.querySelectorAll(".blog-card").forEach((card) => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(term) ? "" : "none";
              });
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load posts:", err);
          container.innerHTML = "<p class=\"loading\">Failed to load posts.</p>";
        });
    }
  }

  // --- Sticky Mini-Player for Videos (eat.html & watch.html) ---
  const videoEls = Array.from(document.querySelectorAll(".responsive-video"));
  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY;
    videoEls.forEach((video) => {
      const triggerPoint = video.offsetTop + video.offsetHeight;
      video.classList.toggle("mini-player", scrollPos > triggerPoint);
    });
  });
});
