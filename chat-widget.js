// "Message David" widget: round button bottom right → chat-style panel with a message form.
// Sends the message straight to Supabase (table contact_messages, insert-only – see Nawee_Supabase/11-contact-messages.sql);
// a Supabase function then emails it to david@nawee.net with the visitor as reply-to. No cookies, nothing loaded from
// third parties – the request to Supabase only happens when someone clicks "Send".
(function () {
    const SUPABASE_URL = "https://sphhbjfyreugpuzbwird.supabase.co";
    const SUPABASE_KEY = "sb_publishable_jhaV37RIZUZph1S5bikzYQ_RKtDrHvF"; // publishable key: safe to be public (insert-only table)

    const lang = (document.documentElement.lang || "en").slice(0, 2) === "de" ? "de" : "en";
    const T = {
        de: {
            open: "Nachricht an David schreiben", close: "Chat schließen",
            nudge: "Fragen? Schreiben Sie mir direkt 👋", nudgeClose: "Hinweis schließen",
            name: "David Nawee", status: "Antwortet meist innerhalb weniger Stunden",
            hello: "Hallo, ich bin David 👋",
            intro: "Fragen zum Englischunterricht oder zu den Preisen? Schreiben Sie mir – ich antworte per E-Mail.",
            message: "Ihre Nachricht", email: "Ihre E-Mail-Adresse (für meine Antwort)", yourName: "Ihr Name (optional)",
            send: "Senden", sending: "Wird gesendet …",
            privacy: 'Ich speichere Ihre Angaben, um Ihnen zu antworten. Mehr in der <a href="datenschutz.html#chat">Datenschutzerklärung</a>.',
            thanks: (mail) => `Danke! Ihre Nachricht ist angekommen. Ich antworte Ihnen so bald wie möglich an ${mail}.`,
            error: 'Das hat leider nicht geklappt. Schreiben Sie mir gern direkt an <a href="mailto:david@nawee.net">david@nawee.net</a>.',
            invalid: "Bitte schreiben Sie eine Nachricht und geben Sie eine gültige E-Mail-Adresse an.",
        },
        en: {
            open: "Send David a message", close: "Close chat",
            nudge: "Questions? Write me directly 👋", nudgeClose: "Close hint",
            name: "David Nawee", status: "Usually replies within a few hours",
            hello: "Hi, I’m David 👋",
            intro: "Questions about English lessons or prices? Write me – I’ll reply by email.",
            message: "Your message", email: "Your email (for my reply)", yourName: "Your name (optional)",
            send: "Send", sending: "Sending …",
            privacy: 'I store your details to reply to you. More in the <a href="privacy-policy.html#chat">privacy policy</a>.',
            thanks: (mail) => `Thanks! Your message has arrived. I’ll get back to you at ${mail} as soon as I can.`,
            error: 'Sorry, that didn’t work. Feel free to email me directly at <a href="mailto:david@nawee.net">david@nawee.net</a>.',
            invalid: "Please write a message and enter a valid email address.",
        },
    }[lang];

    // Lesson request choices (shown when someone clicks "Request a lesson" or a price card's "Request" link).
    // ⚠️ Keep in sync with the price cards in index.html / index-en.html when prices change.
    const LESSONS = {
        de: { lesson: "Stunde", price: "Preis", where: "Ort", online: "Online", inPerson: "Vor Ort (Hannover)",
              title: "Stunde anfragen", details: "Passende Zeiten, Ihr Niveau und Ziel (optional)", pick: "Bitte wählen Sie eine Stunde aus.",
              types: [["general", "Allgemeines Englisch · 60 Min. · 30 €"], ["general-pack", "Allgemeines Englisch · 10er-Paket · 270 €"], ["pro", "Berufsenglisch · 60 Min. · 45 €"], ["pro-pack", "Berufsenglisch · 10er-Paket · 405 €"]],
              tiers: [] },
        en: { lesson: "Lesson", price: "Price", where: "Where", online: "Online", inPerson: "In person (Hannover)",
              title: "Request a lesson", details: "Times that suit you, your level and goal (optional)", pick: "Please choose a lesson.",
              types: [["general", "General English · 60 min · €30"], ["general-pack", "General English · 10-lesson package · €270"], ["pro", "Professional English · 60 min · €45"], ["pro-pack", "Professional English · 10-lesson package · €405"]],
              tiers: [] },
    }[lang];
    const TIERED = [];  // lesson types where the visitor picks a price tier (none since 2026-11-05: fixed prices)

    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const AVATAR = "assets/david-avatar.jpg";

    const root = document.createElement("div");
    root.className = "nw-chat";
    root.innerHTML = `
        <section class="nw-chat-panel" id="nw-chat-panel" role="dialog" aria-label="${T.open}" hidden>
            <header class="nw-chat-head">
                <img src="${AVATAR}" alt="" width="40" height="40">
                <div><strong>${T.name}</strong><span>${T.status}</span></div>
                <button type="button" class="nw-chat-x" aria-label="${T.close}">×</button>
            </header>
            <div class="nw-chat-body">
                <div class="nw-msg nw-msg--david"><strong>${T.hello}</strong> ${T.intro}</div>
                <form class="nw-chat-form" novalidate>
                    <div class="nw-req" hidden>
                        <p class="nw-req-h">${LESSONS.lesson}</p>
                        <div class="nw-pills" data-group="type">${LESSONS.types.map(([v, t]) => `<button type="button" class="nw-pill" data-v="${v}" aria-pressed="false">${t}</button>`).join("")}</div>
                        <div data-tier-wrap hidden><p class="nw-req-h">${LESSONS.price}</p>
                        <div class="nw-pills" data-group="tier">${LESSONS.tiers.map(([v, t]) => `<button type="button" class="nw-pill" data-v="${v}" aria-pressed="false">${t}</button>`).join("")}</div></div>
                        <p class="nw-req-h">${LESSONS.where}</p>
                        <div class="nw-pills" data-group="where"><button type="button" class="nw-pill" data-v="online" aria-pressed="false">${LESSONS.online}</button><button type="button" class="nw-pill" data-v="inperson" aria-pressed="false">${LESSONS.inPerson}</button></div>
                    </div>
                    <label class="nw-sr" for="nw-chat-message">${T.message}</label>
                    <textarea id="nw-chat-message" name="message" rows="4" maxlength="2000" placeholder="${T.message}" required></textarea>
                    <label class="nw-sr" for="nw-chat-email">${T.email}</label>
                    <input id="nw-chat-email" name="email" type="email" maxlength="200" autocomplete="email" placeholder="${T.email}" required>
                    <label class="nw-sr" for="nw-chat-name">${T.yourName}</label>
                    <input id="nw-chat-name" name="name" type="text" maxlength="80" autocomplete="name" placeholder="${T.yourName}">
                    <input class="nw-hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
                    <p class="nw-chat-note" aria-live="polite"></p>
                    <button type="submit" class="button primary nw-chat-send">${T.send} <span aria-hidden="true">→</span></button>
                    <p class="nw-chat-privacy">${T.privacy}</p>
                </form>
            </div>
        </section>
        <div class="nw-chat-nudge" hidden>
            <button type="button" class="nw-chat-nudge-text">${T.nudge}</button>
            <button type="button" class="nw-chat-nudge-x" aria-label="${T.nudgeClose}">×</button>
        </div>
        <button type="button" class="nw-chat-btn" aria-expanded="false" aria-controls="nw-chat-panel" aria-label="${T.open}">
            <img src="${AVATAR}" alt="" width="60" height="60">
            <span class="nw-chat-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span>
        </button>`;
    document.body.appendChild(root);
    document.body.classList.add("has-nw-chat");

    const panel = root.querySelector(".nw-chat-panel");
    const button = root.querySelector(".nw-chat-btn");
    const form = root.querySelector(".nw-chat-form");
    const body = root.querySelector(".nw-chat-body");
    const note = root.querySelector(".nw-chat-note");
    const field = (n) => form.elements.namedItem(n); // not form.name: that is the form's own name attribute

    // small speech bubble next to the photo: explains what the button does (David, 2026-11-04).
    // Shows after a few seconds, closes with ×, stays closed for this visit, hides while the chat is open.
    const nudge = root.querySelector(".nw-chat-nudge");
    const NUDGE_KEY = "nw-chat-nudge-closed";
    let nudgeClosed = false;
    try { nudgeClosed = sessionStorage.getItem(NUDGE_KEY) === "1"; } catch (e) { /* private mode */ }
    const hideNudge = (forGood) => {
        nudge.hidden = true;
        if (forGood) { try { sessionStorage.setItem(NUDGE_KEY, "1"); } catch (e) { /* private mode */ } }
    };
    if (!nudgeClosed) setTimeout(() => { if (panel.hidden) nudge.hidden = false; }, 3000);
    nudge.querySelector(".nw-chat-nudge-x").addEventListener("click", () => hideNudge(true));

    const setOpen = (open) => {
        if (open) hideNudge(true);
        panel.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
        root.classList.toggle("is-open", open);
        if (open && form.isConnected) setTimeout(() => field("message").focus(), 50);
    };
    button.addEventListener("click", () => setOpen(panel.hidden));
    nudge.querySelector(".nw-chat-nudge-text").addEventListener("click", () => setOpen(true));
    // "Request a lesson" (data-lesson-request="<type>", optional data-tier): the chat shows lesson choices as buttons.
    // Opening the chat any other way shows the normal message form. Without JavaScript the link (an email) still works.
    const req = root.querySelector(".nw-req"), tierWrap = root.querySelector("[data-tier-wrap]");
    const chosen = {};
    const pick = (group, value) => {
        chosen[group] = value;
        req.querySelectorAll(`[data-group="${group}"] .nw-pill`).forEach((p) => p.setAttribute("aria-pressed", String(p.dataset.v === value)));
        if (group === "type") tierWrap.hidden = !TIERED.includes(value);
    };
    const setRequestMode = (on, type, tier) => {
        req.hidden = !on;
        field("message").placeholder = on ? LESSONS.details : T.message;
        field("message").rows = on ? 3 : 4;
        if (on) { pick("type", type || chosen.type || ""); if (TIERED.length) pick("tier", tier || chosen.tier || ""); pick("where", chosen.where || "online"); }
    };
    req.addEventListener("click", (e) => { const p = e.target.closest(".nw-pill"); if (p) pick(p.closest("[data-group]").dataset.group, p.dataset.v); });
    document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-lesson-request]");
        if (!b || !form.isConnected) return;
        e.preventDefault();
        setRequestMode(true, b.dataset.lessonRequest, b.dataset.tier);
        setOpen(true);
    });
    button.addEventListener("click", () => setRequestMode(false));
    nudge.querySelector(".nw-chat-nudge-text").addEventListener("click", () => setRequestMode(false));
    root.querySelector(".nw-chat-x").addEventListener("click", () => { setOpen(false); button.focus(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { setOpen(false); button.focus(); } });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let message = field("message").value.trim();
        if (!req.hidden) {  // lesson request: the choices become the first lines of the message
            if (!chosen.type) { note.textContent = LESSONS.pick; return; }
            const label = (list, v) => (list.find(([k]) => k === v) || [, v])[1];
            message = [`${LESSONS.title}`, `${LESSONS.lesson}: ${label(LESSONS.types, chosen.type)}`,
                ...(TIERED.includes(chosen.type) ? [`${LESSONS.price}: ${label(LESSONS.tiers, chosen.tier)}`] : []),
                `${LESSONS.where}: ${chosen.where === "inperson" ? LESSONS.inPerson : LESSONS.online}`, message].filter(Boolean).join("\n");
        }
        const email = field("email").value.trim();
        const name = field("name").value.trim();
        if (field("website").value) return; // honeypot: bots fill every field
        if (message.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = T.invalid; return; }

        const send = form.querySelector(".nw-chat-send");
        send.disabled = true;
        send.textContent = T.sending;
        note.textContent = "";
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
                method: "POST",
                headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
                body: JSON.stringify({ lang, page: location.pathname.slice(0, 120) || "/", name: name || null, email, message }),
            });
            if (!res.ok) throw new Error(String(res.status));
            form.remove();
            body.insertAdjacentHTML("beforeend",
                `<div class="nw-msg nw-msg--you">${esc(message).replace(/\n/g, "<br>")}</div>` +
                `<div class="nw-msg nw-msg--david">${esc(T.thanks(email))}</div>`);
        } catch (err) {
            note.innerHTML = T.error;
            send.disabled = false;
            send.innerHTML = `${T.send} <span aria-hidden="true">→</span>`;
        }
    });
})();
