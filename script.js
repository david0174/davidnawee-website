document.documentElement.classList.add("js");

const revealItems = document.querySelectorAll(
    ".card, .benefit, .approach-copy, .about-copy, .future, .consultation-inner"
);

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealItems.forEach((element) => {
        element.classList.add("reveal");
        observer.observe(element);
    });
} else {
    revealItems.forEach((element) => element.classList.add("visible"));
}

// LinkedIn posts shown in the grid, newest first.
// To add a post: on LinkedIn open the post, click "…" → "Embed this post",
// then copy the address inside src="…" from the embed code and paste it below.
const linkedinPosts = [
    "https://www.linkedin.com/embed/feed/update/urn:li:share:7517964795745083393",
    "https://www.linkedin.com/embed/feed/update/urn:li:share:7513548537536806912",
    "https://www.linkedin.com/embed/feed/update/urn:li:share:7509928475101642753",
];

const linkedinButton = document.getElementById("linkedin-load");
const linkedinGrid = document.getElementById("linkedin-grid");

if (linkedinButton && linkedinGrid) {
    linkedinButton.addEventListener("click", () => {
        linkedinPosts.forEach((src) => {
            const iframe = document.createElement("iframe");
            // collapsed=1: only the first lines of text, so the image shows sooner
            const url = new URL(src);
            url.searchParams.set("collapsed", "1");
            iframe.src = url.href;
            iframe.title = document.documentElement.lang === "de" ? "LinkedIn-Beitrag" : "LinkedIn post";
            iframe.loading = "lazy";
            iframe.setAttribute("allowfullscreen", "");
            linkedinGrid.appendChild(iframe);
        });

        document.getElementById("linkedin-consent").hidden = true;
    });
}

// Dropdowns in the header: the language icon and the burger menu (small screens)
const dropdowns = [
    [document.querySelector(".language-toggle"), document.getElementById("language-menu")],
    [document.querySelector(".menu-toggle"), document.getElementById("mobile-menu")],
].filter(([toggle, menu]) => toggle && menu);

const closeDropdown = ([toggle, menu]) => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
};

dropdowns.forEach(([toggle, menu]) => {
    toggle.addEventListener("click", () => {
        const opening = menu.hidden;
        dropdowns.forEach(closeDropdown);
        menu.hidden = !opening;
        toggle.setAttribute("aria-expanded", String(opening));
    });

    // Close after choosing a link, e.g. jumping to a section
    menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeDropdown([toggle, menu]);
    });
});

// Close when clicking anywhere outside a menu
document.addEventListener("click", (event) => {
    if (!event.target.closest(".language-switch, .menu-switch")) dropdowns.forEach(closeDropdown);
});

// Close with the Escape key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") dropdowns.forEach(closeDropdown);
});

// "Back to top" button: appears after scrolling down, scrolls smoothly back up
const backToTop = document.createElement("button");
backToTop.type = "button";
backToTop.className = "back-to-top";
backToTop.setAttribute("aria-label", document.documentElement.lang === "de" ? "Nach oben scrollen" : "Back to top");
backToTop.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
document.body.appendChild(backToTop);

const toggleBackToTop = () => backToTop.classList.toggle("is-visible", window.scrollY > 600);
window.addEventListener("scroll", toggleBackToTop, { passive: true });
toggleBackToTop();

backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const skip = document.querySelector(".skip-link");
    if (skip) skip.focus({ preventScroll: true });
});

// Language: remember the language a visitor picks in the menu and open that version on later visits
// (no popup; search engines still see every page in both languages)
(() => {
    const PREF_KEY = "nawee-lang";
    const lang = document.documentElement.lang.startsWith("de") ? "de" : "en";
    const other = lang === "de" ? "en" : "de";
    const getPref = () => { try { return localStorage.getItem(PREF_KEY); } catch { return null; } };
    const setPref = (value) => { try { localStorage.setItem(PREF_KEY, value); } catch { /* storage unavailable */ } };

    // choosing a language in the menu counts as an explicit choice
    document.querySelectorAll(".language-menu a[lang], .mobile-menu-languages a[lang]").forEach((a) => {
        a.addEventListener("click", () => setPref(a.lang));
    });

    const alternate = document.querySelector(`link[rel="alternate"][hreflang="${other}"]`);
    if (!alternate) return; // page exists in one language only
    const go = () => location.replace((new URL(alternate.href).pathname.split("/").pop() || "index.html") + location.search + location.hash);
    if (getPref() === other) { go(); return; }
    if (getPref()) return; // the visitor already chose this language
    // first visit: the device's language and region decide (no IP lookup – nothing leaves the browser).
    // German stays for German-language devices and devices set to Germany, Austria or Switzerland; everyone else gets English.
    // (English pages never redirect to German, so nobody gets bounced while browsing.)
    const bot = /bot|crawl|spider|slurp|google|bing|yandex|duckduck|baidu|facebookexternalhit|linkedinbot|preview/i.test(navigator.userAgent);
    if (bot || navigator.webdriver) return; // search engines see each page as it is
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    let zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { /* ignore */ }
    const germanRegion = langs.some((l) => /-(DE|AT|CH|LI)\b/i.test(l)) || /^Europe\/(Berlin|Busingen|Vienna|Zurich|Vaduz)$/.test(zone);
    const wantsGerman = /^de\b/i.test(langs[0] || "") || germanRegion;
    if (lang === "de" && !wantsGerman) go(); // e.g. a phone in the US lands on the English page
})();

// Homepage: underline "Über mich" / "About Me" in the menu while the About Me section is on screen
(() => {
    const section = document.getElementById("ueber-mich");
    const links = document.querySelectorAll('.site-header nav > a[href*="#ueber-mich"], .mobile-menu > a[href*="#ueber-mich"]');
    if (!section || !links.length) return;
    // active while the section covers the middle of the screen
    const update = () => {
        const rect = section.getBoundingClientRect();
        const middle = window.innerHeight / 2;
        const active = rect.top <= middle && rect.bottom >= middle;
        links.forEach((a) => a.classList.toggle("is-current", active));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
})();

// "Wie ich arbeite": clicking a tile opens its panel below the row (one at a time); clicking it again closes it
const methodTabs = document.querySelectorAll(".method-tab");
methodTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const opening = tab.getAttribute("aria-expanded") !== "true";
        methodTabs.forEach((other) => {
            other.setAttribute("aria-expanded", "false");
            document.getElementById(other.getAttribute("aria-controls")).hidden = true;
        });
        if (opening) {
            tab.setAttribute("aria-expanded", "true");
            document.getElementById(tab.getAttribute("aria-controls")).hidden = false;
        }
    });
});

// Hero tabs: jump to the main offers on the homepage (English coaching, Communication Coaching, free tests);
// the Communication Coaching box lights up briefly so it's clear where to look
document.querySelectorAll(".hero-audience").forEach((tab) => {
    tab.addEventListener("click", (event) => {
        const target = document.querySelector(tab.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        document.querySelectorAll(".hero-audience").forEach((t) => t.classList.toggle("active", t === tab));
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        const box = target.querySelector(".pillar-inner");
        if (!box) return;
        box.classList.remove("is-highlight");
        void box.offsetWidth; // restart the animation
        box.classList.add("is-highlight");
        setTimeout(() => box.classList.remove("is-highlight"), 2300);
    });
});

// Newsletter: forward-moving entrance (heading, momentum line, form) once the section scrolls into view;
// "News from Nawee" (#linkedin): heading, posts and follow buttons pop forward the same way;
// "Let's find out what you need" (#kontakt): intro rises, benefits slide in from the left, contact panel from the right
["newsletter", "linkedin", "kontakt"].forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    if (!("IntersectionObserver" in window)) { section.classList.add("in-view"); return; }
    const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { section.classList.add("in-view"); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(section);
});

// Section headlines: words rise in one after another when the headline scrolls into view, then the
// highlighted word (<mark class="hl">) gets its yellow marker stroke. Skipped for "reduce motion".
(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const headlines = document.querySelectorAll("main h2:not(.about-heading)");
    let index;
    const split = (node) => {
        [...node.childNodes].forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const parts = child.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                parts.forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.append(part); return; }
                    const word = document.createElement("span");
                    word.className = "hw";
                    word.style.setProperty("--i", index++);
                    word.textContent = part;
                    frag.append(word);
                });
                child.replaceWith(frag);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                split(child);
            }
        });
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-revealed");
            observer.unobserve(e.target);
        });
    }, { threshold: 0.6 });
    headlines.forEach((h) => {
        index = 0;
        h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim()); // read as one sentence
        split(h);
        h.style.setProperty("--words", index);
        h.classList.add("reveal-words");
        observer.observe(h);
    });
})();

// Free consultation boxes ("Not sure what you need? Let's find out together."): pop in once they scroll into view
(() => {
    const cards = document.querySelectorAll(".consult-card");
    if (!cards.length) return;
    if (!("IntersectionObserver" in window)) { cards.forEach((c) => c.classList.add("in-view")); return; }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
        });
    }, { threshold: 0.4 });
    cards.forEach((c) => observer.observe(c));
})();

// In-page links (menu, hero tabs, buttons) stop exactly below the sticky header,
// so a section starts right where its background color begins
(() => {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const setOffset = () => { document.documentElement.style.scrollPaddingTop = `${header.offsetHeight}px`; };
    setOffset();
    window.addEventListener("resize", setOffset);
})();


// DARK ONLY (David, 2026-11-03): nawee.net always uses the dark look – no light/dark switch any more.
// <html data-theme="dark"> is set in every page; this only swaps the logo to its white-lettering version.
(function () {
    document.documentElement.dataset.theme = "dark";
    document.querySelectorAll("img.logo").forEach((img) => {
        img.src = img.src.replace(/logo_notext(-dark)?\.png/, "logo_notext-dark.png");
    });
    // tab icon: the blue 'N' tile (David, 2026-11-03) – no dark variant any more
})();

// Newsletter (English tips, learning list – footer strip on every page): send the form to Brevo in the background and show the result in place
// (same logic as nawee.net). Nothing is loaded from Brevo until someone clicks the button.
(() => {
    // addresses signed up from this browser – only a scrambled fingerprint is kept, never the address itself
    const fingerprint = (email) => {
        let h = 5381;
        for (const c of String(email).trim().toLowerCase()) h = ((h * 33) ^ c.codePointAt(0)) >>> 0;
        return h.toString(36);
    };
    const KEY = "dn-nl-done";
    const subscribed = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
    const remember = (email) => { try { localStorage.setItem(KEY, JSON.stringify([...new Set([...subscribed(), fingerprint(email)])].slice(-5))); } catch { /* ignore */ } };

    document.querySelectorAll(".nl-form").forEach((form) => {
        const button = form.querySelector('button[type="submit"]');
        const status = form.querySelector(".nl-status");
        const buttonHTML = button.innerHTML;
        const show = (message, ok) => {
            status.textContent = message;
            status.classList.toggle("nl-status--error", !ok);
            status.hidden = false;
        };
        // no Brevo form link yet → show the box, but greyed out with a "starting soon" note
        if (!/^https:\/\/[\w.-]+\.sibforms\.com\//.test(form.getAttribute("action") || "")) {
            form.querySelectorAll("input, button").forEach((el) => { el.disabled = true; });
            form.classList.add("nl-form--soon");
            show(form.dataset.soon || "", true);
            return;
        }
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (form.nl_zx_hp && form.nl_zx_hp.value) { show(form.dataset.error, false); return; } // spam trap
            if (form.email_address_check) form.email_address_check.value = "";
            if (subscribed().includes(fingerprint(form.EMAIL.value))) { show(form.dataset.already, false); return; }
            button.disabled = true;
            button.textContent = form.dataset.sending;
            try {
                const send = (data) => fetch(form.action, { method: "POST", body: new URLSearchParams(data) })
                    .then(async (r) => ({ ok: r.ok, result: await r.json().catch(() => ({})) }));
                const fields = new FormData(form); fields.delete("nl_zx_hp");
                let { ok, result } = await send(fields);
                if (!ok || !result.success) {
                    // safety net: if Brevo rejects the optional fields (first name, topics), sign up with the email address only
                    const data = new FormData(form); data.delete("VORNAME"); data.delete("THEMEN"); data.delete("nl_zx_hp");
                    ({ ok, result } = await send(data));
                }
                if (!ok || !result.success) {
                    const text = JSON.stringify(result || {}).toLowerCase();
                    if (/already|bereits|exist|déjà/.test(text)) { show(form.dataset.already, false); return; }
                    throw new Error("not saved");
                }
                remember(form.EMAIL.value);
                form.reset();
                show(form.dataset.success, true);
            } catch {
                show(form.dataset.error, false);
            } finally {
                button.disabled = false;
                button.innerHTML = buttonHTML;
            }
        });
    });
})();

// Numbered steps (founder path, "How we work together"): cards appear one after another when the list scrolls into view,
// then the arrows between them show the order (styles in brand.css). Without IntersectionObserver everything stays visible.
(function () {
    const lists = document.querySelectorAll(".process-steps");
    if (!lists.length || !("IntersectionObserver" in window)) return;
    const seen = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            seen.unobserve(entry.target);
        });
    }, { threshold: 0.2 });
    lists.forEach((list) => { list.classList.add("js-steps"); seen.observe(list); });
})();

// "How we work together" as a click-through (David, 2026-11-04): one big tile per step, a step bar on top,
// Back / Next below; the last Next books the free intro call. Without JS the four steps simply show side by side.
(function () {
    const list = document.querySelector("#methode .process-steps");
    if (!list) return;
    const steps = [...list.querySelectorAll(".process-step")];
    if (steps.length < 2) return;
    const de = (document.documentElement.lang || "").startsWith("de");
    const L = de
        ? { next: "Nächster Schritt", back: "Zurück", of: (a, b) => `Schritt ${a} von ${b}`, book: "Kostenloses Kennenlernen buchen", upNext: "Als Nächstes:", ready: "Bereit? Lassen Sie uns sprechen!" }
        : { next: "Next step", back: "Back", of: (a, b) => `Step ${a} of ${b}`, book: "Book your free intro call", upNext: "Up next:", ready: "You’re ready – let’s talk!" };
    const calLink = list.querySelector('a[href*="cal.com"]');
    const cal = calLink ? calLink.getAttribute("href") : "https://cal.com/nawee/15min";

    list.classList.remove("js-steps");
    list.classList.add("steps-carousel");

    const bar = document.createElement("div");
    bar.className = "steps-progress";
    steps.forEach((step, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "steps-dot";
        const title = step.querySelector("h3") ? step.querySelector("h3").textContent : "";
        dot.innerHTML = `<span class="steps-dot-num">${i + 1}</span><span class="steps-dot-label"></span>`;
        dot.querySelector(".steps-dot-label").textContent = title;
        dot.addEventListener("click", () => show(i));
        bar.appendChild(dot);
    });
    list.before(bar);
    // momentum: a gold bar that fills with every step
    const track = document.createElement("div");
    track.className = "steps-track";
    track.innerHTML = "<span></span>";
    bar.after(track);
    const fill = track.querySelector("span");

    const controls = document.createElement("div");
    controls.className = "steps-controls";
    controls.innerHTML = `<button type="button" class="button secondary steps-back"></button><span class="steps-count" aria-live="polite"></span><button type="button" class="button primary steps-next"></button>`;
    list.after(controls);
    // momentum: a peek at what comes next
    const teaser = document.createElement("button");
    teaser.type = "button";
    teaser.className = "steps-teaser";
    controls.after(teaser);
    teaser.addEventListener("click", () => next.click());
    const back = controls.querySelector(".steps-back");
    const next = controls.querySelector(".steps-next");
    const count = controls.querySelector(".steps-count");
    back.textContent = `← ${L.back}`;

    // sounds (David, 2026-11-05): every step plays a higher note (C – E – G – B, step 4 = just before the peak),
    // "Book your free intro call" resolves it with a short celebration (C major arpeggio + sparkle).
    // Generated live with Web Audio (no files), only after a click, quiet, with an on/off switch that is remembered.
    const SOUND_KEY = "nawee-steps-sound";
    let soundOn = true;
    try { soundOn = localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) { /* private mode */ }
    let ctx = null;
    const audio = () => {
        if (!soundOn || !(window.AudioContext || window.webkitAudioContext)) return null;
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    };
    const note = (freq, at, dur = 0.55, vol = 0.12, type = "sine") => {
        const a = audio(); if (!a) return;
        const t = a.currentTime + at;
        [[type, 1, vol], ["triangle", 2, vol * 0.18]].forEach(([wave, mult, v]) => {  // soft tone + a little shimmer
            const o = a.createOscillator(), g = a.createGain();
            o.type = wave; o.frequency.value = freq * mult;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(v, t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(a.destination);
            o.start(t); o.stop(t + dur + 0.05);
        });
    };
    const STEP_NOTES = [523.25, 659.25, 783.99, 987.77];  // C5 E5 G5 B5
    const stepTone = (i) => note(STEP_NOTES[Math.min(i, STEP_NOTES.length - 1)], 0, 0.5);
    const celebrate = () => {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => note(f, k * 0.075, 0.6, 0.11));   // C E G C – resolved
        [1046.5, 1318.5, 1568].forEach((f) => note(f, 0.34, 1.1, 0.06));                     // final chord, held
        [2093, 2637, 3136].forEach((f, k) => note(f, 0.42 + k * 0.06, 0.35, 0.025));          // sparkle
    };
    const soundBtn = document.createElement("button");
    soundBtn.type = "button";
    soundBtn.className = "steps-sound";
    const paintSound = () => {
        soundBtn.textContent = soundOn ? "🔊" : "🔇";
        soundBtn.setAttribute("aria-pressed", String(soundOn));
        soundBtn.setAttribute("aria-label", de ? (soundOn ? "Töne ausschalten" : "Töne einschalten") : (soundOn ? "Turn sounds off" : "Turn sounds on"));
        soundBtn.title = soundBtn.getAttribute("aria-label");
    };
    soundBtn.addEventListener("click", () => {
        soundOn = !soundOn;
        try { localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch (e) { /* ignore */ }
        paintSound();
        if (soundOn) stepTone(current);
    });
    paintSound();
    list.appendChild(soundBtn);  // small, in the top-right corner of the step tile (not in the step bar, where it looked like a 5th step)

    let current = 0;
    function show(i, silent) {
        const target = Math.max(0, Math.min(steps.length - 1, i));
        if (!silent && target !== current) stepTone(target);
        current = target;
        steps.forEach((step, k) => { step.hidden = k !== current; step.classList.toggle("is-active", k === current); });
        bar.querySelectorAll(".steps-dot").forEach((dot, k) => {
            dot.classList.toggle("is-active", k === current);
            dot.classList.toggle("is-done", k < current);
            dot.setAttribute("aria-current", k === current ? "step" : "false");
        });
        back.disabled = current === 0;
        count.textContent = L.of(current + 1, steps.length);
        const last = current === steps.length - 1;
        next.textContent = last ? `${L.book} →` : `${L.next} →`;
        next.dataset.book = last ? "1" : "";
        fill.style.width = `${((current + 1) / steps.length) * 100}%`;
        const nextTitle = !last && steps[current + 1].querySelector("h3") ? steps[current + 1].querySelector("h3").textContent : "";
        teaser.textContent = last ? L.ready : `${L.upNext} ${nextTitle} →`;
    }
    back.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => {
        if (next.dataset.book === "1") { celebrate(); window.open(cal, "_blank", "noopener"); return; }
        show(current + 1);
    });
    // swipe on phones
    let x0 = null;
    list.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    list.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
        x0 = null;
    });
    show(0, true);
})();

// Newsletter strip: slides in and the button glows once when it scrolls into view (styles in dark-extra.css).
// Content stays visible without JavaScript or with reduced motion (the hidden start state only applies with .nl-anim).
(() => {
    const strip = document.querySelector(".nl-strip");
    if (!strip || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    strip.classList.add("nl-anim");
    new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        strip.classList.add("nl-in");
        obs.disconnect();
    }, { threshold: 0.35 }).observe(strip);
})();
