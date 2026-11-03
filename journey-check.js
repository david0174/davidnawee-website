// Business check ("Where are you on your business journey?") on journey-check.html / gruendungs-check.html.
// Answers are sent as one message into the same Supabase table as the chat widget (contact_messages, insert-only),
// so David gets them by email through the existing contactnotify function. Nothing is sent before "Send".
(function () {
    const form = document.querySelector(".jc-form");
    if (!form) return;
    const SUPABASE_URL = "https://sphhbjfyreugpuzbwird.supabase.co";
    const SUPABASE_KEY = "sb_publishable_jhaV37RIZUZph1S5bikzYQ_RKtDrHvF"; // publishable key: safe to be public (insert-only table)
    const lang = (document.documentElement.lang || "en").slice(0, 2) === "de" ? "de" : "en";
    const CAL = "https://cal.com/nawee/15min";

    const T = {
        en: {
            journey: "business-consulting.html#steps",
            steps: {
                idea: ["Idea & foundation", "We sharpen your target customers, your offer and your prices.", "business-consulting.html#steps"],
                setup: ["Setup", "You get a clear checklist for registration and taxes – and a tax adviser if you need one.", "business-consulting.html#steps"],
                digital: ["Digital presence", "Website, email, booking and payments – so customers can find and book you.", "business-starter-package.html"],
                ai: ["AI & automation", "The right AI tools, with inquiries and appointments running on their own.", "ai-consulting.html"],
                customers: ["Win customers", "Your offer in one clear sentence and confident sales conversations.", "communication-leadership.html"],
                growth: ["Growth", "Regular check-ins so you keep moving – and stay focused.", "business-consulting.html#steps"],
            },
            byStage: { idea: ["idea", "setup"], soon: ["idea", "setup", "digital"], new: ["digital", "ai"], running: ["ai", "customers", "growth"] },
            invalid: "Please answer questions 1 and 2 and enter a valid email address.",
            sending: "Sending …", send: "Send my answers",
            error: 'Sorry, that didn’t work. Feel free to email me at <a href="mailto:david@nawee.net">david@nawee.net</a>.',
            hello: (n) => (n ? `Thanks, ${n}!` : "Thanks!"),
            lead: "Based on your answers, I’d start here:",
            more: "Learn more",
            reply: (m) => `I’ll get back to you personally at ${m} within 24 hours.`,
            call: "Want to talk sooner? Book a free 15-minute call",
            subject: "Business check",
            labels: { stage: "Stage", who: "Who", needs: "Needs", timing: "Timing", language: "Language", challenge: "Biggest challenge" },
        },
        de: {
            journey: "business-beratung.html#steps",
            steps: {
                idea: ["Idee & Fundament", "Wir schärfen Ihre Zielkunden, Ihr Angebot und Ihre Preise.", "business-beratung.html#steps"],
                setup: ["Gründung", "Sie bekommen eine klare Checkliste für Anmeldung und Steuern – und bei Bedarf eine Steuerberatung.", "business-beratung.html#steps"],
                digital: ["Digitaler Auftritt", "Website, E-Mail, Buchung und Zahlungen – damit Kunden Sie finden und buchen können.", "business-startpaket.html"],
                ai: ["KI & Automatisierung", "Die passenden KI-Tools, Anfragen und Termine laufen automatisch.", "ki-beratung.html"],
                customers: ["Kunden gewinnen", "Ihr Angebot in einem klaren Satz und sichere Verkaufsgespräche.", "kommunikation-fuehrung.html"],
                growth: ["Wachstum", "Regelmäßige Check-ins, damit Sie dranbleiben – und fokussiert bleiben.", "business-beratung.html#steps"],
            },
            byStage: { idea: ["idea", "setup"], soon: ["idea", "setup", "digital"], new: ["digital", "ai"], running: ["ai", "customers", "growth"] },
            invalid: "Bitte beantworten Sie Frage 1 und 2 und geben Sie eine gültige E-Mail-Adresse an.",
            sending: "Wird gesendet …", send: "Antworten senden",
            error: 'Das hat leider nicht geklappt. Schreiben Sie mir gern an <a href="mailto:david@nawee.net">david@nawee.net</a>.',
            hello: (n) => (n ? `Danke, ${n}!` : "Danke!"),
            lead: "Nach Ihren Antworten würde ich hier anfangen:",
            more: "Mehr erfahren",
            reply: (m) => `Ich melde mich innerhalb von 24 Stunden persönlich bei Ihnen unter ${m}.`,
            call: "Lieber gleich sprechen? Kostenloses 15-Minuten-Gespräch buchen",
            subject: "Gründungs-Check",
            labels: { stage: "Stand", who: "Wer", needs: "Bedarf", timing: "Zeitrahmen", language: "Sprache", challenge: "Größte Herausforderung" },
        },
    }[lang];

    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const field = (n) => form.elements.namedItem(n); // not form.name: that is the form's own name attribute
    const labelOf = (input) => input.closest("label").textContent.trim().replace(/\s+/g, " ");
    const checked = (n) => [...form.querySelectorAll(`input[name="${n}"]:checked`)];
    const note = form.querySelector(".jc-note");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (field("website").value) return; // honeypot: bots fill every field
        const stage = checked("stage").at(0), who = checked("who").at(0), timing = checked("timing").at(0), language = checked("language").at(0);
        const needs = checked("needs");
        const email = field("email").value.trim(), name = field("name").value.trim(), challenge = field("challenge").value.trim();
        if (!stage || !who || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = T.invalid; return; }

        const L = T.labels;
        const message = [
            `${T.subject}`,
            `${L.stage}: ${labelOf(stage)}`,
            `${L.who}: ${labelOf(who)}`,
            `${L.needs}: ${needs.length ? needs.map(labelOf).join(", ") : "–"}`,
            `${L.timing}: ${timing ? labelOf(timing) : "–"}`,
            `${L.language}: ${language ? labelOf(language) : "–"}`,
            `${L.challenge}: ${challenge || "–"}`,
        ].join("\n").slice(0, 2000);

        const send = form.querySelector(".jc-send");
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
        } catch (err) {
            note.innerHTML = T.error;
            send.disabled = false;
            send.textContent = T.send;
            return;
        }

        // personal suggestion: the steps they ticked (in journey order), otherwise what fits their stage
        const order = ["idea", "setup", "digital", "ai", "customers", "growth"];
        const picked = needs.map((n) => n.value);
        const keys = (picked.length ? order.filter((k) => picked.includes(k)) : T.byStage[stage.value] || ["idea"]).slice(0, 3);
        const items = keys.map((k) => {
            const s = T.steps[k];
            return `<li><strong>${s[0]}</strong> – ${s[1]} <a class="text-link" href="${s[2]}">${T.more} →</a></li>`;
        }).join("");
        const result = document.querySelector(".jc-result");
        result.innerHTML = `<h2>${esc(T.hello(name))}</h2><p>${T.lead}</p><ol class="jc-plan">${items}</ol>` +
            `<p>${esc(T.reply(email))}</p>` +
            `<a class="button primary" href="${CAL}" target="_blank" rel="noopener">${T.call} <span aria-hidden="true">→</span></a>`;
        form.hidden = true;
        result.hidden = false;
        result.scrollIntoView({ behavior: "smooth", block: "start" });
    });
})();
