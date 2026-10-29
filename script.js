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
    if (getPref() === other) {
        location.replace((new URL(alternate.href).pathname.split("/").pop() || "index.html") + location.hash);
    }
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


// THEME BUTTON – light/dark. Without a choice the site follows the device (dark.css); the choice is remembered
// in localStorage ("dn-theme") and set on <html data-theme> by a tiny script in <head> before the page paints.
(function () {
    const root = document.documentElement;
    const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : !!(media && media.matches);
    const lang = (root.lang || "en").slice(0, 2);
    const LABELS = { de: ["Dunkles Design", "Helles Design"], he: ["מצב כהה", "מצב בהיר"], en: ["Dark mode", "Light mode"] };
    const [toDark, toLight] = LABELS[lang] || LABELS.en;
    const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M20.7 14.6A8.5 8.5 0 0 1 9.4 3.3a.7.7 0 0 0-.9-.9A10 10 0 1 0 21.6 15.5a.7.7 0 0 0-.9-.9z"/></svg>';
    const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7"/></g></svg>';

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";

    function render() {
        const dark = isDark();
        button.innerHTML = dark ? SUN : MOON;
        button.setAttribute("aria-label", dark ? toLight : toDark);
        button.title = dark ? toLight : toDark;
    }

    button.addEventListener("click", () => {
        const next = isDark() ? "light" : "dark";
        root.dataset.theme = next;
        try { localStorage.setItem("dn-theme", next); } catch (e) { /* private mode: works until reload */ }
        render();
    });
    if (media && media.addEventListener) media.addEventListener("change", render);

    const header = document.querySelector(".site-header");
    if (header) {
        const spot = header.querySelector(".language-switch, .menu-switch");
        if (spot) spot.before(button); else header.appendChild(button);
    }
    render();
})();

// Newsletter "Smart Tools, Strong Voice": send the form to Brevo in the background and show the result in place
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
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!/^https:\/\/[\w.-]+\.sibforms\.com\//.test(form.getAttribute("action") || "")) { show(form.dataset.error, false); return; }
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
                if ((!ok || !result.success) && form.VORNAME && form.VORNAME.value) {
                    // safety net: if Brevo rejects the optional first name, sign up with the email address only
                    const data = new FormData(form); data.delete("VORNAME"); data.delete("nl_zx_hp");
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
