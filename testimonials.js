// Testimonials / Kundenstimmen – one list for the whole site.
//
// HOW TO ADD A REAL ONE (David):
//   1. Copy one entry, put in the real quote, first name (+ initial) and role – only with the person's written OK.
//   2. Set real: true. Only entries with real: true are shown on the live website.
//   3. Delete the sample entries (real: false) once you have real ones.
//   tags: where it appears – "english" (English coaching pages), "ai" (AI training pages), "coaching", "workshop".
//   Every entry appears on the homepage of its language (de / en).
//
// Samples (real: false) are ONLY visible in a local preview on this Mac (file:// or 127.0.0.1), marked "BEISPIEL" –
// never on davidnawee.com. Publishing invented reviews is illegal in Germany (UWG).

window.TESTIMONIALS = [
    { real: false, lang: "de", tags: ["english"], name: "Anna M.", role: "Projektleiterin, Maschinenbau",
      quote: "Vorher war ich in englischen Meetings sehr still. Nach sechs Sitzungen melde ich mich zu Wort – und werde verstanden." },
    { real: false, lang: "de", tags: ["ai", "workshop"], name: "Thomas K.", role: "Teamleiter Vertrieb",
      quote: "Der Workshop war praxisnah statt theoretisch. Mein Team nutzt Copilot jetzt jeden Tag – und weiß, was nicht hineingehört." },
    { real: false, lang: "de", tags: ["coaching"], name: "Lena S.", role: "Studentin",
      quote: "David hat mir geholfen, vor Präsentationen ruhiger zu werden. Ich bereite mich jetzt anders vor – und es funktioniert." },
    { real: false, lang: "en", tags: ["english"], name: "Marco R.", role: "Software engineer",
      quote: "I knew the grammar, but I froze in calls. David gave me phrases and practice that made the difference within weeks." },
    { real: false, lang: "en", tags: ["ai", "workshop"], name: "Sarah L.", role: "HR manager",
      quote: "Clear, practical and honest about AI’s limits. Our team left with prompts we used the very next morning." },
    { real: false, lang: "en", tags: ["coaching"], name: "Daniel B.", role: "Founder",
      quote: "The coaching helped me pitch with confidence. I finally say the point first – and people listen." },
];

(() => {
    const local = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
    const lang = (document.documentElement.lang || "de").slice(0, 2);
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const initials = (n) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    document.querySelectorAll("[data-testimonials]").forEach((box) => {
        const want = box.dataset.testimonials;  // "all" or a tag
        const list = (window.TESTIMONIALS || []).filter((t) => (t.real || local) && t.lang === lang && (want === "all" || t.tags.includes(want))).slice(0, 3);
        if (!list.length) return;  // nothing real yet → the section stays hidden
        box.querySelector("[data-testimonials-list]").innerHTML = list.map((t) => `
            <figure class="testimonial">
                ${t.real ? "" : `<span class="testimonial-sample">${lang === "de" ? "BEISPIEL – nicht veröffentlicht" : "SAMPLE – not published"}</span>`}
                <blockquote>“${esc(t.quote)}”</blockquote>
                <figcaption><span class="testimonial-avatar" aria-hidden="true">${esc(initials(t.name))}</span><span><strong>${esc(t.name)}</strong><br>${esc(t.role)}</span></figcaption>
            </figure>`).join("");
        box.hidden = false;
    });
})();
