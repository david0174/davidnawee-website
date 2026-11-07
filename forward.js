// learn.nawee.net moved back to nawee.net (2026-11-07): nawee.net is the learning platform again, learn.nawee.net only forwards.
// go(path): forwards to the same page on nawee.net. The first time, progress saved in this browser under learn.nawee.net
// (lessons, cards, trophies, settings – keys "nawee-…") is handed over once in the URL fragment, which never reaches a
// server; nawee.net takes it over ("#nawee-move=", the newer data wins). Login sessions are NOT handed over.
window.NaweeForward = (() => {
    const pack = () => {
        try {
            if (localStorage.getItem("nawee-moved")) return "";
            const data = {};
            for (let i = 0; i < localStorage.length; i += 1) {
                const k = localStorage.key(i);
                if (/^nawee-/.test(k) && !/^nawee-(lang|migrated|moved)$/.test(k)) data[k] = localStorage.getItem(k);
            }
            if (!Object.keys(data).length) return "";
            localStorage.setItem("nawee-moved", "1");
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        } catch (e) { return ""; }
    };
    const go = (path) => {
        const p = pack();
        const hash = location.hash ? location.hash.slice(1) : "";
        const frag = p ? "#nawee-move=" + encodeURIComponent(p) + (hash ? "&h=" + encodeURIComponent(hash) : "") : (hash ? "#" + hash : "");
        location.replace("https://nawee.net/" + path + location.search + frag);
    };
    return { go };
})();
