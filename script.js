const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const currentYear = document.querySelector("#current-year");
const revealTargets = document.querySelectorAll(".reveal");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (navToggle && header) {
  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  },
);

revealTargets.forEach((target) => observer.observe(target));


/* ---------- Projetos: slider ---------- */
const projetos = document.querySelector(".projetos");

if (projetos) {
  const slider = projetos.querySelector(".slider");
  const track = projetos.querySelector(".slider-track");
  const slides = [...projetos.querySelectorAll(".slide")];
  const bars = [...projetos.querySelectorAll(".slider-bar")];
  const current = projetos.querySelector(".slider-current");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURATION = 7000;
  let index = 0;
  let timer = null;
  let visible = false;

  projetos.style.setProperty("--slide-time", `${DURATION}ms`);

  const go = (i) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, k) => {
      const on = k === index;
      slide.classList.toggle("is-active", on);
      if (on) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
    bars.forEach((bar, k) => {
      bar.classList.toggle("is-done", k < index);
      bar.classList.remove("is-active");
      bar.setAttribute("aria-selected", String(k === index));
    });
    const active = bars[index];
    void active.offsetWidth;
    active.classList.add("is-active");
    current.textContent = String(index + 1).padStart(2, "0");
    restart();
  };

  function restart() {
    clearTimeout(timer);
    if (reduceMotion || !visible) return;
    timer = setTimeout(() => {
      if (projetos.classList.contains("is-paused")) {
        restart();
      } else {
        go(index + 1);
      }
    }, DURATION);
  }

  bars.forEach((bar, k) => bar.addEventListener("click", () => go(k)));

  projetos.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  });

  slider.addEventListener("mouseenter", () => projetos.classList.add("is-paused"));
  slider.addEventListener("mouseleave", () => projetos.classList.remove("is-paused"));

  let startX = 0;
  let deltaX = 0;
  let dragging = false;

  let hintCount = 0;
  let interacted = false;
  let hintTimer = null;
  const hideHint = () => slider.classList.remove("show-hint");
  const showHint = () => {
    if (interacted || reduceMotion || hintCount >= 3) return;
    hintCount += 1;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      slider.classList.remove("show-hint");
      void slider.offsetWidth;
      slider.classList.add("show-hint");
      hintTimer = setTimeout(hideHint, 3400);
    }, 600);
  };

  slider.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    slider.setPointerCapture(event.pointerId);
    startX = event.clientX;
    deltaX = 0;
    slider.classList.add("is-dragging");
  });

  slider.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 12 && !interacted) {
      interacted = true;
      clearTimeout(hintTimer);
      hideHint();
    }
    track.style.transform = `translateX(calc(${-index * 100}% + ${deltaX}px))`;
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    slider.classList.remove("is-dragging");
    if (Math.abs(deltaX) > 60) go(deltaX < 0 ? index + 1 : index - 1);
    else go(index);
  };

  slider.addEventListener("pointerup", endDrag);
  slider.addEventListener("pointercancel", endDrag);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) showHint();
    if (visible) restart();
    else clearTimeout(timer);
  }, { threshold: 0.3 }).observe(slider);

  go(0);
}

/* ---------- Trajetória: ano sorteado ---------- */
const trajSection = document.querySelector(".trajetoria");

if (trajSection) {
  const aside = trajSection.querySelector(".traj-aside");
  const yearEl = trajSection.querySelector(".traj-year");
  const yearBtn = trajSection.querySelector(".traj-year-btn");
  const steps = [...trajSection.querySelectorAll(".traj-step")];
  const ticks = [...trajSection.querySelectorAll(".traj-tick")];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;
  let shownText = "";
  let rolling = null;

  const label = (year) => year.replace("-", "–");

  const scramble = (target, full) => {
    cancelAnimationFrame(rolling);
    const text = label(target);
    const chars = [...text];
    const prev = [...shownText];
    yearEl.classList.toggle("is-range", target.includes("-"));
    shownText = text;
    if (reduce) {
      yearEl.textContent = text;
      return;
    }
    const stopAt = {};
    let order = 0;
    chars.forEach((ch, i) => {
      if (/\d/.test(ch) && (full || prev.length !== chars.length || prev[i] !== ch)) {
        stopAt[i] = 260 + order * 90;
        order += 1;
      }
    });
    const start = performance.now();
    const frame = (now) => {
      const elapsed = now - start;
      let done = true;
      yearEl.innerHTML = chars
        .map((ch, i) => {
          if (!(i in stopAt) || elapsed >= stopAt[i]) return ch;
          done = false;
          return `<span class="is-rolling">${Math.floor(Math.random() * 10)}</span>`;
        })
        .join("");
      if (!done) rolling = requestAnimationFrame(frame);
    };
    rolling = requestAnimationFrame(frame);
  };

  const show = (index, full = false) => {
    current = (index + steps.length) % steps.length;
    steps.forEach((step, i) => {
      const on = i === current;
      step.classList.toggle("is-active", on);
      step.hidden = !on;
    });
    ticks.forEach((tick, i) => {
      tick.classList.toggle("is-active", i === current);
      tick.classList.toggle("is-past", i < current);
    });
    scramble(steps[current].dataset.year, full);
  };

  let clicked = false;
  let hintCount = 0;
  let hintTimer = null;
  const hideHint = () => aside.classList.remove("show-hint");
  const showHint = () => {
    if (clicked || reduce || hintCount >= 3) return;
    hintCount += 1;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      aside.classList.add("show-hint");
      hintTimer = setTimeout(hideHint, 3200);
    }, 900);
  };
  const markClicked = () => {
    clicked = true;
    clearTimeout(hintTimer);
    hideHint();
  };

  yearBtn.addEventListener("click", () => {
    markClicked();
    show(current + 1);
  });
  ticks.forEach((tick, i) =>
    tick.addEventListener("click", () => {
      markClicked();
      show(i);
    }),
  );

  shownText = label(steps[0].dataset.year);
  yearEl.textContent = shownText;

  let firstTime = true;
  new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      if (firstTime) {
        firstTime = false;
        show(0, true);
      }
      showHint();
    },
    { threshold: 0.5 },
  ).observe(yearBtn);
}

/* ---------- Equipe: retratos ---------- */
const portraits = [...document.querySelectorAll(".portrait")];

if (portraits.length) {
  const detail = document.querySelector(".member-detail");
  const detailName = detail.querySelector(".member-detail-name");
  const detailBio = detail.querySelector(".member-detail-bio");
  const detailLink = detail.querySelector(".member-link");
  let active = 0;
  let swapTimer = null;

  const select = (index) => {
    if (index === active) return;
    active = index;
    const p = portraits[index];
    portraits.forEach((el, i) => {
      el.classList.toggle("is-active", i === index);
      el.setAttribute("aria-pressed", String(i === index));
    });
    detail.classList.add("is-changing");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      detailName.textContent = p.dataset.name;
      detailBio.textContent = p.dataset.bio;
      detailLink.href = p.dataset.href;
      detail.classList.remove("is-changing");
    }, 260);
  };

  const canHover = window.matchMedia("(hover: hover)").matches;
  portraits.forEach((p, i) => {
    p.addEventListener("click", () => select(i));
    p.addEventListener("focus", () => select(i));
    if (canHover) p.addEventListener("mouseenter", () => select(i));
  });
}

/* ---------- Infraestrutura: números contando ---------- */
const counters = document.querySelectorAll(".stat-num[data-count]");

if (counters.length) {
  const reduceCount = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        const el = entry.target;
        const target = Number(el.dataset.count);
        if (reduceCount) return;
        const start = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - (1 - t) ** 3;
          el.textContent = String(Math.round(eased * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = "0";
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 },
  );
  counters.forEach((el) => countObserver.observe(el));
}

/* ---------- Base institucional: zoom do mapa até a UFPI ---------- */
const mapSvg = document.querySelector(".base-map-svg");

if (mapSvg) {
  const mapBox = mapSvg.parentElement;
  const pin = mapBox.querySelector(".base-pin");
  const picos = mapSvg.querySelector(".picos");
  const [tx, ty] = mapSvg.dataset.target.split(" ").map(Number);
  const FULL = mapSvg.getAttribute("viewBox").split(" ").map(Number);
  const reduceMap = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let progress = 0;
  let started = false;

  const targetBox = () => {
    const w = mapBox.clientWidth;
    const h = mapBox.clientHeight;
    const vw = FULL[2] * (w < 600 ? 0.36 : 0.5);
    const vh = vw * (h / w);
    return [tx - vw * (w < 600 ? 0.42 : 0.4), ty - vh * 0.42, vw, vh];
  };

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  const render = () => {
    const end = targetBox();
    const k = ease(progress);
    const box = FULL.map((v, i) => v + (end[i] - v) * k);
    mapSvg.setAttribute("viewBox", box.map((v) => v.toFixed(2)).join(" "));
    const unitsPerPx = Math.max(box[2] / mapBox.clientWidth, box[3] / mapBox.clientHeight);
    picos.setAttribute("transform", `translate(${tx} ${ty}) scale(${(unitsPerPx * 1.6).toFixed(4)})`);
    const pt = mapSvg.createSVGPoint();
    pt.x = tx;
    pt.y = ty;
    const screen = pt.matrixTransform(mapSvg.getScreenCTM());
    const rect = mapBox.getBoundingClientRect();
    pin.style.setProperty("--pin-x", `${screen.x - rect.left}px`);
    pin.style.setProperty("--pin-y", `${screen.y - rect.top}px`);
  };

  const zoomIn = () => {
    if (started) return;
    started = true;
    if (reduceMap) {
      progress = 1;
      render();
      pin.classList.add("is-visible");
      return;
    }
    const start = performance.now() + 300;
    const step = (now) => {
      progress = Math.min(1, Math.max(0, (now - start) / 2400));
      render();
      if (progress < 1) requestAnimationFrame(step);
      else pin.classList.add("is-visible");
    };
    requestAnimationFrame(step);
  };

  render();
  window.addEventListener("resize", render);
  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) zoomIn();
    },
    { threshold: 0.45 },
  ).observe(mapBox);
}
