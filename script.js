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

// Newsletter: send the form to Brevo in the background and show the result in place.
// Nothing is loaded from Brevo until someone actually clicks "Abonnieren".
document.querySelectorAll(".nl-form").forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".nl-status");
    const buttonHTML = button.innerHTML; // keeps the animated arrow

    const show = (message, ok) => {
        status.textContent = message;
        status.classList.toggle("nl-status--error", !ok);
        status.hidden = false;
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (form.email_address_check.value) return; // spam trap filled in: ignore

        button.disabled = true;
        button.textContent = form.dataset.sending;
        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: new URLSearchParams(new FormData(form)),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error("not saved");
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

// Language: on a first visit with a different browser language, ask once whether to switch to the other
// language version (no forced redirect, so search engines still see every page), and remember the choice.
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
    const target = (new URL(alternate.href).pathname.split("/").pop() || "index.html") + location.hash;

    const pref = getPref();
    const preview = new URLSearchParams(location.search).has("lang-preview"); // ?lang-preview always shows the box (nothing is saved)
    if (!preview && pref === other) { location.replace(target); return; } // visitor chose the other language before
    if (!preview && pref) return;

    const browserLangs = (navigator.languages || [navigator.language || ""]).map((l) => l.toLowerCase());
    const suggest = preview || (lang === "de"
        ? !browserLangs.some((l) => l.startsWith("de")) // German page, browser without German
        : (browserLangs[0] || "").startsWith("de")); // English page, browser set to German first
    if (!suggest) return;

    // first visit with a different browser language: ask once in a small box, remember the answer.
    // Only the two language names, so it is understandable without reading either language.
    const names = { de: "Deutsch", en: "English" };
    const overlay = document.createElement("div");
    overlay.className = "lang-modal";
    overlay.innerHTML = `<div class="lang-modal-box" role="dialog" aria-modal="true" aria-labelledby="lang-modal-title">
        <svg class="lang-modal-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18"></path><path d="M12 3a14 14 0 0 0 0 18"></path></svg>
        <p class="lang-modal-title" id="lang-modal-title"><span lang="en">Language</span> · <span lang="de">Sprache</span></p>
        <div class="lang-modal-actions">
            <a class="button primary" href="${target}" lang="${other}">${names[other]}</a>
            <button type="button" class="button secondary" lang="${lang}">${names[lang]}</button>
        </div>
    </div>`;
    const close = () => { if (!preview) setPref(lang); overlay.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (event) => { if (event.key === "Escape") close(); };
    overlay.querySelector("a").addEventListener("click", () => { if (!preview) setPref(other); });
    overlay.querySelector("button").addEventListener("click", close);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    document.body.append(overlay);
    overlay.querySelector("a").focus();
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

