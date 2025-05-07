document.addEventListener("DOMContentLoaded", () => {
  console.log("Let’s Go To... site loaded!");

  // Load blog posts if on eat.html
  const blogDataRaw = document.getElementById("blog-data");
  const blogContainer = document.getElementById("blog-container");

  if (window.location.pathname.includes("eat") && blogDataRaw && blogContainer) {
    try {
      const blogData = JSON.parse(blogDataRaw.textContent);
      blogData.forEach((post, i) => {
        const el = document.createElement("div");
        el.className = "blog-card";
        el.style.animation = `fadeInUp 0.6s ease forwards`;
        el.style.animationDelay = `${i * 0.15}s`;
        el.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
        blogContainer.appendChild(el);
      });
    } catch (err) {
      console.error("Failed to parse blog data:", err);
    }
  }

  // Blog read more button interaction
  document.addEventListener("click", (e) => {
    if (e.target.matches(".expand-btn")) {
      alert("More blog details coming soon!");
    }
  });

  // Smooth scroll for internal anchor links
  document.querySelectorAll("a[href^='#']").forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href"))?.scrollIntoView({
        behavior: "smooth"
      });
    });
  });
});
