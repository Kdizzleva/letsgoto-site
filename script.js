// Inject fadeInUp keyframes animation if not already present
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`;
document.head.appendChild(style);
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

// --- Environment-aware motion interactivity for blobs ---
const isTouch = window.matchMedia("(pointer: coarse)").matches;
const blobs = document.querySelectorAll('.blob');

if (!isTouch) {
  // Desktop mouse parallax
  document.addEventListener("mousemove", (e) => {
    blobs.forEach((blob, index) => {
      const speed = 0.01 * (index + 1);
      const x = (window.innerWidth / 2 - e.clientX) * speed;
      const y = (window.innerHeight / 2 - e.clientY) * speed;
      blob.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
} else {
  // Mobile gyroscope fallback
  const enableGyro = () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(response => {
        if (response === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        }
      }).catch(console.error);
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }
  };

  const handleOrientation = (event) => {
    const { beta = 0, gamma = 0 } = event;
    blobs.forEach((blob, i) => {
      const x = gamma * 0.5 * (i + 1);
      const y = beta * 0.5 * (i + 1);
      blob.style.transform = `translate(${x}px, ${y}px)`;
    });
  };

  // Trigger permission request on tap
  const motionPrompt = document.createElement('button');
  motionPrompt.innerText = "Enable Motion";
  motionPrompt.style.position = 'fixed';
  motionPrompt.style.bottom = '1rem';
  motionPrompt.style.left = '50%';
  motionPrompt.style.transform = 'translateX(-50%)';
  motionPrompt.style.padding = '1rem 2rem';
  motionPrompt.style.borderRadius = '10px';
  motionPrompt.style.border = 'none';
  motionPrompt.style.background = 'var(--accent-pink)';
  motionPrompt.style.color = '#fff';
  motionPrompt.style.zIndex = '9999';
  motionPrompt.style.fontWeight = 'bold';
  motionPrompt.style.cursor = 'pointer';
  document.body.appendChild(motionPrompt);

  motionPrompt.addEventListener('click', () => {
    enableGyro();
    motionPrompt.remove();
  });
}
