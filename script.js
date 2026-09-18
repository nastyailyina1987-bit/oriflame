/** Личный Telegram для бронирований (без @) */
const TELEGRAM_USERNAME = "Nastyailyina";

const KIT_COUNT = 15;

const modal = document.getElementById("booking-modal");
const form = document.getElementById("booking-form");
const kitsGrid = document.getElementById("kits-grid");
const modalKitDisplay = document.getElementById("modal-kit-display");
const inputKitNumber = document.getElementById("input-kit-number");
const formStatus = document.getElementById("form-status");

let lastFocusedElement = null;

function kitLabel(kitNumber) {
  return `Набор №${kitNumber}`;
}

function renderKits() {
  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= KIT_COUNT; i += 1) {
    const li = document.createElement("li");
    li.className = "kit-card";
    li.innerHTML = `
      <figure class="kit-card__media">
        <img src="photo_${i}.jpg" alt="Набор №${i}" width="1200" height="1200" loading="lazy" decoding="async" />
      </figure>
      <div class="kit-card__actions">
        <button type="button" class="btn" data-kit="${i}">
          Забронировать
        </button>
      </div>
    `;
    fragment.appendChild(li);
  }

  kitsGrid.appendChild(fragment);
}

function setModalKitFields(kitNumber) {
  const kit = String(kitNumber).trim();
  const label = kitLabel(kit);

  inputKitNumber.value = kit;
  inputKitNumber.defaultValue = kit;
  modalKitDisplay.value = label;
  modalKitDisplay.defaultValue = label;
}

function openModal(kitNumber) {
  const kit = String(kitNumber).trim();
  if (!kit) return;

  lastFocusedElement = document.activeElement;
  modal.removeAttribute("hidden");
  requestAnimationFrame(() => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  });

  form.reset();
  setModalKitFields(kit);
  setFormStatus("");

  const firstInput = document.getElementById("input-first-name");
  if (firstInput) {
    firstInput.focus();
  }

  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  const onTransitionEnd = (event) => {
    if (event.target !== modal.querySelector(".modal__panel")) return;
    modal.setAttribute("hidden", "");
    modal.removeEventListener("transitionend", onTransitionEnd);
  };
  modal.addEventListener("transitionend", onTransitionEnd);

  setTimeout(() => {
    if (!modal.classList.contains("is-open")) {
      modal.setAttribute("hidden", "");
    }
  }, 400);

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function setFormStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = "form-status";
  if (type) {
    formStatus.classList.add(`form-status--${type}`);
  }
}

function buildBookingMessage(firstName, lastName, kitNumber) {
  const uniqueSuffix = Date.now();
  return `Бронь! ${kitLabel(kitNumber)}. Имя: ${firstName}, Фамилия: ${lastName}. ${uniqueSuffix}`;
}

function buildTelegramUrl(message) {
  const username = TELEGRAM_USERNAME.replace(/^@/, "");
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`;
}

function handleFormSubmit(event) {
  event.preventDefault();

  const firstName = document.getElementById("input-first-name").value.trim();
  const lastName = document.getElementById("input-last-name").value.trim();
  const kitNumber = inputKitNumber.value;

  if (!firstName || !lastName) {
    setFormStatus("Пожалуйста, заполните имя и фамилию.", "error");
    return;
  }

  const message = buildBookingMessage(firstName, lastName, kitNumber);
  const telegramUrl = buildTelegramUrl(message);

  window.open(telegramUrl, "_blank", "noopener,noreferrer");

  setFormStatus("Telegram открыт — нажмите «Отправить» в чате.", "success");
  setTimeout(closeModal, 1800);
}

function initKitCardTouchFeedback() {
  let touchedCard = null;
  let clearTimer = null;

  const clearTouched = () => {
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
    if (touchedCard) {
      touchedCard.classList.remove("is-touched");
      touchedCard = null;
    }
  };

  const scheduleClear = () => {
    if (clearTimer) {
      clearTimeout(clearTimer);
    }
    clearTimer = setTimeout(clearTouched, 320);
  };

  kitsGrid.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "mouse") return;
      const card = event.target.closest(".kit-card");
      if (!card || !kitsGrid.contains(card)) return;
      clearTouched();
      touchedCard = card;
      card.classList.add("is-touched");
    },
    { passive: true }
  );

  kitsGrid.addEventListener("pointerup", scheduleClear, { passive: true });
  kitsGrid.addEventListener("pointercancel", scheduleClear, { passive: true });
  kitsGrid.addEventListener("pointerleave", scheduleClear, { passive: true });
}

function initEventListeners() {
  initKitCardTouchFeedback();

  kitsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-kit]");
    if (!button) return;
    const kitNumber = button.getAttribute("data-kit");
    if (!kitNumber) return;
    openModal(kitNumber);
  });

  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  form.addEventListener("submit", handleFormSubmit);
}

function initBackgroundParticles() {
  const canvas = document.getElementById("bg-particles");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const mouse = { x: -9999, y: -9999, active: false };
  const particles = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const config = {
    density: 0.000085,
    minCount: 78,
    maxCount: 160,
    minRadius: 0.85,
    maxRadius: 1.55,
    drift: 0.08,
    damping: 0.985,
    maxSpeed: 1.35,
    particleRepel: 0.55,
    particlePadding: 10,
    mouseRadius: 110,
    mouseForce: 2.8,
    connectDistance: 130,
    lineOpacityMax: 0.24,
    mouseConnectDistance: 165,
    mouseLineOpacityMax: 0.38,
  };

  function particleCountForSize() {
    const area = window.innerWidth * window.innerHeight;
    return Math.min(
      config.maxCount,
      Math.max(config.minCount, Math.floor(area * config.density))
    );
  }

  function randomRadius() {
    return config.minRadius + Math.random() * (config.maxRadius - config.minRadius);
  }

  function createParticle() {
    const radius = randomRadius();
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * config.drift,
      vy: (Math.random() - 0.5) * config.drift,
      radius,
    };
  }

  function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles() {
    particles.length = 0;
    const count = particleCountForSize();
    for (let i = 0; i < count; i += 1) {
      particles.push(createParticle());
    }
  }

  function clampSpeed(particle) {
    const speed = Math.hypot(particle.vx, particle.vy);
    if (speed > config.maxSpeed) {
      particle.vx = (particle.vx / speed) * config.maxSpeed;
      particle.vy = (particle.vy / speed) * config.maxSpeed;
    }
  }

  function applyMouseRepulsion(particle) {
    if (!mouse.active) return;

    const dx = particle.x - mouse.x;
    const dy = particle.y - mouse.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= config.mouseRadius || dist === 0) return;

    const force = ((config.mouseRadius - dist) / config.mouseRadius) * config.mouseForce;
    particle.vx += (dx / dist) * force;
    particle.vy += (dy / dist) * force;
  }

  function applyParticleRepulsion() {
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = a.radius + b.radius + config.particlePadding;

        if (dist < minDist) {
          const push = ((minDist - dist) / dist) * config.particleRepel;
          const fx = dx * push;
          const fy = dy * push;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
    }
  }

  function updateParticles() {
    particles.forEach((particle) => {
      particle.vx += (Math.random() - 0.5) * 0.02;
      particle.vy += (Math.random() - 0.5) * 0.02;

      applyMouseRepulsion(particle);

      particle.x += particle.vx;
      particle.y += particle.vy;

      particle.vx *= config.damping;
      particle.vy *= config.damping;

      clampSpeed(particle);

      if (particle.x < particle.radius) {
        particle.x = particle.radius;
        particle.vx *= -0.85;
      } else if (particle.x > window.innerWidth - particle.radius) {
        particle.x = window.innerWidth - particle.radius;
        particle.vx *= -0.85;
      }

      if (particle.y < particle.radius) {
        particle.y = particle.radius;
        particle.vy *= -0.85;
      } else if (particle.y > window.innerHeight - particle.radius) {
        particle.y = window.innerHeight - particle.radius;
        particle.vy *= -0.85;
      }
    });

    applyParticleRepulsion();
  }

  function drawConstellationLines() {
    ctx.lineCap = "round";

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        if (dist > config.connectDistance) continue;

        const alpha = (1 - dist / config.connectDistance) * config.lineOpacityMax;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(220, 192, 122, ${alpha})`;
        ctx.lineWidth = 0.55;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    if (!mouse.active) return;

    particles.forEach((particle) => {
      const dx = particle.x - mouse.x;
      const dy = particle.y - mouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist > config.mouseConnectDistance) return;

      const alpha = (1 - dist / config.mouseConnectDistance) * config.mouseLineOpacityMax;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(232, 213, 163, ${alpha})`;
      ctx.lineWidth = 0.65;
      ctx.moveTo(mouse.x, mouse.y);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    });
  }

  function drawParticleDots() {
    particles.forEach((particle) => {
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 2.2
      );
      gradient.addColorStop(0, "rgba(255, 236, 190, 0.75)");
      gradient.addColorStop(0.45, "rgba(212, 175, 100, 0.45)");
      gradient.addColorStop(1, "rgba(196, 169, 98, 0)");

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, particle.radius * 1.65, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawConstellationLines();
    drawParticleDots();
  }

  function tick() {
    updateParticles();
    drawParticles();
    requestAnimationFrame(tick);
  }

  function setPointer(x, y) {
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
  }

  document.addEventListener("mousemove", (event) => {
    setPointer(event.clientX, event.clientY);
  });

  document.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    setPointer(touch.clientX, touch.clientY);
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    initParticles();
  });

  resizeCanvas();
  initParticles();
  requestAnimationFrame(tick);
}


document.addEventListener("DOMContentLoaded", () => {
  renderKits();
  initEventListeners();
  initBackgroundParticles();
});
