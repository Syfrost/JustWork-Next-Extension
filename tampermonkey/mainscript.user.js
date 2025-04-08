// ==UserScript==
// @name         Script collector auto
// @namespace    https://github.com/Syfrost/JustWork-Next-Extension
// @version      1.4.9
// @description  Charge plusieurs scripts distants
// @author       Cedric G
// @match        https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/*
// @require      https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/refs/heads/master/tampermonkey/tm_check_validation.js
// @require      https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/refs/heads/master/tampermonkey/tm_copy_cri.js
// @require      https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/refs/heads/master/tampermonkey/tm_copy_rex.js
// @require      https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/refs/heads/master/tampermonkey/tm_already_pass.js
// @require      https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/refs/heads/master/tampermonkey/tm_prm_tab.js
// @updateURL    https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/mainscript.user.js
// @downloadURL  https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/mainscript.user.js
// @grant        GM_info
// ==/UserScript==

(function () {
    'use strict';

    const versionLocale = GM_info.script.version;
    const scriptURL = "https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/mainscript.user.js";

    console.log("[Script Collector Auto] Version locale :", versionLocale);

    fetch(scriptURL)
        .then(r => r.text())
        .then(text => {
            const match = text.match(/@version\s+([^\n]+)/);
            if (match) {
                const versionDistante = match[1].trim();
                console.log("[Script Collector Auto] Version distante :", versionDistante);
                console.log("[Script Collector Auto] Version locale :", versionLocale);

                if (estNouvelleVersion(versionLocale, versionDistante)) {
                    console.log("[Script Collector Auto] ➕ Mise à jour disponible !");
                    afficherBoutonMAJ(versionDistante, scriptURL);
                } else {
                    console.log("[Script Collector Auto] ✅ Script à jour.");
                }
            } else {
                console.warn("[Script Collector Auto] ⚠️ Impossible de détecter la version distante.");
            }
        })
        .catch(err => console.error("[Script Collector Auto] ❌ Erreur récupération version distante :", err));

    function estNouvelleVersion(local, distante) {
        const toNum = v => v.split('.').map(Number);
        const [l, d] = [toNum(local), toNum(distante)];
        for (let i = 0; i < Math.max(l.length, d.length); i++) {
            const a = l[i] || 0, b = d[i] || 0;
            if (b > a) return true;
            if (b < a) return false;
        }
        return false;
    }

    function afficherBoutonMAJ(versionDistante, installUrl) {
        const container = document.querySelector('div[style*="position: fixed"][style*="bottom: 10px"][style*="right: 10px"]');
        if (!container || document.getElementById("btnMajScript")) return;
    
        const btn = document.createElement("button");
        btn.id = "btnMajScript";
        btn.innerText = `🆕 MAJ dispo (${versionDistante})`;
        btn.onclick = () => {
            alert("Une nouvelle version du script est disponible.\nUn nouvel onglet va s’ouvrir pour l’installation.");
            window.open(installUrl, "_blank");
        };
    
        // Récupérer le message du dernier commit via l’API GitHub
        fetch("https://api.github.com/repos/Syfrost/JustWork-Next-Extension/commits?path=tampermonkey/mainscript.user.js&page=1&per_page=1")
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].commit && data[0].commit.message) {
                    btn.title = data[0].commit.message; // Affiche le message au hover
                }
            })
            .catch(err => {
                console.warn("[Script Collector Auto] ⚠️ Erreur récupération commit :", err);
            });
    
        styleButton(btn, "#ffc107", "fa-arrow-up");
        container.appendChild(btn);
    }

    function styleButton(button, backgroundColor, iconClass) {
        button.style.margin = '5px';
        button.style.backgroundColor = backgroundColor;
        button.style.color = 'black';
        button.style.padding = '5px 10px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.innerHTML = `<i class='fa ${iconClass}'></i> ` + button.innerText;
    }

})();
