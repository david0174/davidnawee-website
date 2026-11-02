// Nawee Learning moved from nawee.net to learn.nawee.net (company site is now nawee.net).
// go(path): forwards to the same page on learn.nawee.net. The first time, progress saved in this browser under
// nawee.net (lessons, trophies, settings – keys "nawee-…") is handed over once in the URL fragment, which never
// reaches a server; learn.nawee.net stores only keys it doesn't have yet. Login sessions are NOT handed over.
window.NaweeLearn = (() => {
    const pack = () => {
        try {
            if (localStorage.getItem("nawee-migrated")) return "";
            const data = {};
            for (let i = 0; i < localStorage.length; i += 1) {
                const k = localStorage.key(i);
                if (/^nawee-/.test(k) && !/^nawee-(lang|migrated)$/.test(k)) data[k] = localStorage.getItem(k);
            }
            if (!Object.keys(data).length) return "";
            localStorage.setItem("nawee-migrated", "1");
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        } catch (e) { return ""; }
    };
    const go = (path) => {
        const p = pack();
        const hash = location.hash ? location.hash.slice(1) : "";
        const frag = p ? "#nawee-migrate=" + encodeURIComponent(p) + (hash ? "&h=" + encodeURIComponent(hash) : "") : (hash ? "#" + hash : "");
        location.replace("https://learn.nawee.net/" + path + location.search + frag);
    };
    const hasLearningData = () => {
        try { return !localStorage.getItem("nawee-migrated") && Object.keys(localStorage).some((k) => /^nawee-(course|trophies|communication|profile|typing|music|reading|vocab)/.test(k)); } catch (e) { return false; }
    };
    return { go, hasLearningData };
})();
