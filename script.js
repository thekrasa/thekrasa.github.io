/*
  Dynamic GitHub Pages case gallery
  ---------------------------------
  Update these constants after you create the GitHub repo.

  Supported case names:
    1-before-aesthetic.jpg
    1-after-aesthetic.jpg
    2-before-restorative.jpg
    2-after-restorative.jpg
    2-before-aesthetic.jpg
    2-after-aesthetic.jpg

  The script groups by BOTH number and category, so 2-aesthetic and
  2-restorative become separate cards instead of overwriting each other.
*/

const REPO_OWNER = "thekrasa";
const REPO_NAME = "thekrasa.github.io";
const BRANCH = "main";
const CASES_FOLDER = "cases";

const fallbackCases = [
  { number: 1, category: "aesthetic", before: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=80", after: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80" },
  { number: 2, category: "restorative", before: "https://images.unsplash.com/photo-1588776814546-daab30f310ce?auto=format&fit=crop&w=1200&q=80", after: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1200&q=80" },
  { number: 2, category: "aesthetic", before: "https://images.unsplash.com/photo-1606265752439-1f18756aa8b3?auto=format&fit=crop&w=1200&q=80", after: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1200&q=80" },
  { number: 3, category: "preventive", before: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80", after: "https://images.unsplash.com/photo-1600170311833-c2cf5280ce49?auto=format&fit=crop&w=1200&q=80" }
];

const gallery = document.querySelector("#caseGallery");
const galleryStatus = document.querySelector("#galleryStatus");
const template = document.querySelector("#caseTemplate");
let allCases = [];

document.querySelector("#year").textContent = new Date().getFullYear();

function safeQuery(selector, scope = document) { return scope.querySelector(selector); }

function scrollToTarget(hash) {
  const target = hash === "#top" ? document.body : safeQuery(hash);
  if (!target) return;
  const navOffset = 88;
  const top = hash === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({ top, behavior: "smooth" });
}

document.querySelectorAll("a[data-scroll]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    event.preventDefault();
    scrollToTarget(href);
    safeQuery(".nav-links")?.classList.remove("open");
    safeQuery(".nav-toggle")?.setAttribute("aria-expanded", "false");
  });
});

safeQuery(".nav-toggle")?.addEventListener("click", (event) => {
  const links = safeQuery(".nav-links");
  links?.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(links?.classList.contains("open")));
});

const backToTop = safeQuery("#backToTop");
backToTop?.addEventListener("click", () => scrollToTarget("#top"));
window.addEventListener("scroll", () => {
  backToTop?.classList.toggle("visible", window.scrollY > 650);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

async function fetchCasesFromGitHub() {
  if (REPO_OWNER === "YOUR_GITHUB_USERNAME" || REPO_NAME === "dentist-site" && REPO_OWNER === "YOUR_GITHUB_USERNAME") {
    throw new Error("Add your GitHub username and repo name in script.js to load real cases.");
  }
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CASES_FOLDER}?ref=${BRANCH}`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}. Check repo owner, repo name, branch, and cases folder.`);
  const files = await response.json();
  if (!Array.isArray(files)) throw new Error("GitHub did not return a file list for the cases folder.");
  return buildCases(files.filter((file) => file.type === "file"));
}

function buildCases(files) {
  // Supports: 001-before-aesthetic.jpg, 1_after_restorative.png, 2-before.jpg
  const imageRegex = /^(\d+)[-_](before|after)(?:[-_]([a-z0-9]+(?:[-_][a-z0-9]+)*))?\.(jpg|jpeg|png|webp|avif)$/i;
  const grouped = new Map();

  files.forEach((file) => {
    const name = file.name || "";
    const match = name.match(imageRegex);
    if (!match) return;
    const number = Number(match[1]);
    const phase = match[2].toLowerCase();
    const category = normalizeCategory(match[3] || "general");
    const key = `${String(number).padStart(5, "0")}--${category}`;
    const existing = grouped.get(key) || { number, category, key };
    existing[phase] = file.download_url || `${CASES_FOLDER}/${name}`;
    grouped.set(key, existing);
  });

  return [...grouped.values()]
    .filter((item) => item.before && item.after)
    .sort((a, b) => a.number - b.number || a.category.localeCompare(b.category));
}

function normalizeCategory(value) {
  return String(value).toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-") || "general";
}

function prettyLabel(value) {
  return String(value || "general").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}


function renderCases(cases) {
  gallery.innerHTML = "";
  if (!cases.length) {
    galleryStatus.textContent = "No matching paired cases found. Each case needs one before image and one after image with the same number and category.";
    refreshCarouselButtons(gallery.closest(".carousel-shell"));
    return;
  }
  galleryStatus.textContent = "";

  const fragment = document.createDocumentFragment();
  cases.forEach((caseItem) => {
    const node = template.content.cloneNode(true);
    const card = safeQuery(".case-card", node);
    const beforeImg = safeQuery(".before-img", node);
    const afterImg = safeQuery(".after-img", node);
    card.dataset.category = caseItem.category;
    beforeImg.src = caseItem.before;
    afterImg.src = caseItem.after;
    beforeImg.alt = "Before dental case photo";
    afterImg.alt = "After dental case photo";
    setupComparison(node);
    fragment.appendChild(node);
  });

  gallery.appendChild(fragment);
  gallery.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  gallery.scrollTo({ left: 0, behavior: "auto" });
  requestAnimationFrame(() => refreshCarouselButtons(gallery.closest(".carousel-shell")));
}

function setupComparison(scope) {
  const comparison = safeQuery(".comparison", scope);
  const slider = safeQuery(".slider", scope);
  const afterWrap = safeQuery(".after-wrap", scope);
  const line = safeQuery(".slider-line", scope);
  const handle = safeQuery(".slider-handle", scope);
  if (!comparison || !slider || !afterWrap || !line || !handle) return;
  const update = (value) => {
    afterWrap.style.width = `${value}%`;
    line.style.left = `${value}%`;
    handle.style.left = `${value}%`;
  };
  slider.addEventListener("input", (event) => update(event.target.value));
  comparison.addEventListener("dblclick", () => { slider.value = 50; update(50); });
  update(slider.value);
}

function setupCarousel(shell) {
  if (!shell) return;
  const track = safeQuery(".carousel-track", shell);
  const leftButton = safeQuery(".carousel-btn-left", shell);
  const rightButton = safeQuery(".carousel-btn-right", shell);
  if (!track || !leftButton || !rightButton) return;

  const getGap = () => parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 24) || 24;
  const getScrollAmount = () => (track.firstElementChild?.getBoundingClientRect().width || track.clientWidth * 0.85) + getGap();
  leftButton.addEventListener("click", () => track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" }));
  rightButton.addEventListener("click", () => track.scrollBy({ left: getScrollAmount(), behavior: "smooth" }));
  track.addEventListener("scroll", () => refreshCarouselButtons(shell), { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") track.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
    if (event.key === "ArrowLeft") track.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  });
  window.addEventListener("resize", () => refreshCarouselButtons(shell));
  refreshCarouselButtons(shell);
}

function refreshCarouselButtons(shell) {
  if (!shell) return;
  const track = safeQuery(".carousel-track", shell);
  const leftButton = safeQuery(".carousel-btn-left", shell);
  const rightButton = safeQuery(".carousel-btn-right", shell);
  if (!track || !leftButton || !rightButton) return;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  leftButton.disabled = track.scrollLeft <= 8;
  rightButton.disabled = track.scrollLeft >= maxScroll - 8 || maxScroll <= 8;
}



function lockPracticeFocusImages() {
  const fixedImages = {
    aesthetic: "assets/focus/aesthetic.jpg",
    restorative: "assets/focus/restorative.jpg",
    preventive: "assets/focus/preventive.jpg",
    endodontic: "assets/focus/patient-care.jpg"
  };

  document.querySelectorAll("[data-expertise-category]").forEach((card) => {
    const img = card.querySelector("[data-expertise-image]");
    const key = card.dataset.expertiseCategory;
    if (img && fixedImages[key]) img.src = fixedImages[key];
  });
}

lockPracticeFocusImages();

document.querySelectorAll(".carousel-shell").forEach(setupCarousel);

(async function initCases() {
  try {
    allCases = await fetchCasesFromGitHub();
    if (!allCases.length) throw new Error("No complete before/after pairs found in the cases folder.");
  } catch (error) {
    allCases = fallbackCases;
    galleryStatus.textContent = `${error.message} Showing demo cases for now.`;
  }
  renderCases(allCases);
})();
