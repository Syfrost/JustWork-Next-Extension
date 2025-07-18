(function () {
    'use strict';

    const processedSections = new WeakMap();
    const donneesTaches = []; // tableau global pour stocker les infos extraites
    let liensEnCours = 0;
    let postEnCours = 0;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            scanContainers();
            ajouterBoutonScanManuel();
        });
    } else {
        scanContainers();
        ajouterBoutonScanManuel();
    }

    function ajouterBoutonScanManuel() {
        const bouton = document.createElement('button');
        bouton.textContent = 'SCAN';
        bouton.style.position = 'fixed';
        bouton.style.width = '65px';
        bouton.style.height = '65px';
        bouton.style.bottom = '20px';
        bouton.style.right = '20px';
        bouton.style.zIndex = '9999';
        bouton.style.padding = '10px 15px';
        bouton.style.background = 'rgba(0, 0, 0, 0.1)';
        bouton.style.color = '#fff';
        bouton.style.border = '2px solid rgb(255, 128, 0)';
        bouton.style.borderRadius = '50px';
        bouton.style.fontSize = '14px';
        bouton.style.cursor = 'pointer';
        bouton.style.boxShadow = '0 2px 8px rgba(255, 104, 0, 0.8)';
        bouton.style.backdropFilter = 'blur(5px)';
        bouton.style.display = 'flex';
        bouton.style.justifyContent = 'center';
        bouton.style.alignItems = 'center';

        bouton.addEventListener('click', scanContainers);

        document.body.appendChild(bouton);
    }

    function scanContainers() {
        console.log('[Planner Script] Démarrage avec scan des conteneurs...');
        const containers = document.querySelectorAll('div.ms-FocusZone');
        console.log(containers);
        containers.forEach(container => {
            const taskCard = container.querySelector('div.taskCard');
            if (!taskCard) {
                console.log("return");
                return;
            }

            const lienElement = container.querySelector('a.referencePreviewDescription');
            let lien = lienElement?.getAttribute('href') || lienElement?.getAttribute('title');
            console.log(lien);

            if (lien && !lien.endsWith('.html')) lien += '.html';
            if (!lien || !lien.includes('.html')) return;

            const numeroReparation = lien.match(/\/(\d+)(?:\.html)?$/)?.[1] || 'inconnu';
            ajouterOverlayTaskCard(taskCard, numeroReparation, 'Chargement...');
            testerLienHttp(lien, taskCard);
        });
    }

    function ajouterOverlayTaskCard(taskCard, numeroReparation, texteLabel = 'Chargement...') {
        const thumbnail = taskCard.querySelector('.thumbnail.placeholder');
        if (!thumbnail) return;

        // Supprime s’il existe déjà (évite doublons)
        const existing = thumbnail.querySelector('.autoelement');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'autoelement';
        container.id = `idreparation-status-${numeroReparation}`;
        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '10';
        container.style.background = 'rgba(255,255,255,0.95)';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '6px';
        container.style.padding = '5px 10px';
        container.style.fontSize = '12px';
        container.style.maxWidth = '160px';

        container.innerHTML = `
        <div class="autoelement__img__container" style="text-align:center;">
            <img src="https://prod.cloud-collectorplus.mt.sncf.fr/assets/images/sprite_src/pictos/Collector_accueil.png"
                 alt="Icon"
                 class="autoelement__img__source"
                 style="width: 24px; height: 24px;">
        </div>
        <span class="autoelement__text text-numeroreparation" style="display:block; font-weight:bold; margin-top:4px;">
            ${numeroReparation}
        </span>
        <span class="autoelement__text text-collector" style="display:block; color: #333;">
            ${texteLabel}
        </span>
    `;

        thumbnail.style.position = 'relative'; // obligatoire pour absolute
        thumbnail.appendChild(container);
    }

    function testerLienHttp(lien, taskCard, tentative = 1) {
        liensEnCours++;

        const maxTentatives = 5;
        const numeroReparation = lien.match(/\/(\d+)\.html$/)?.[1] || 'inconnu';

        GM_xmlhttpRequest({
            method: 'GET',
            url: lien,
            onload: function (response) {
                const overlay = taskCard.querySelector(`#idreparation-status-${numeroReparation}`);

                if (response.status === 200) {
                    const html = response.responseText;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const label = doc.querySelector('span.label-success');
                    let texteLabel = label?.textContent?.trim() || 'non trouvé';

                    // Ajout de la condition de redirection vers AfficherPv
                    if (texteLabel === 'non trouvé' && response.finalUrl?.includes('/Prm/AfficherPv/')) {
                        texteLabel = 'Terminé / PV';
                    }

                    const input = doc.getElementById('idSymbole');
                    const symbole = input?.value?.trim() || 'non trouvé';
                    const inputUser = doc.getElementById('idUser');
                    const idUser = inputUser?.value?.trim() || 'non trouvé';

                    const index = donneesTaches.findIndex(t => t.numeroReparation === numeroReparation);
                    const nouvelleTache = {
                        lien,
                        numeroReparation,
                        label: texteLabel,
                        idSymbole: symbole,
                        idUser: idUser
                    };

                    if (index !== -1) {
                        donneesTaches[index] = nouvelleTache;
                    } else {
                        donneesTaches.push(nouvelleTache);
                    }

                    if (overlay) {
                        overlay.querySelector('.text-collector').textContent = texteLabel;
                        overlay.querySelector('.text-numeroreparation').textContent = numeroReparation;
                        overlay.classList.remove('http-error');
                    }

                    liensEnCours = Math.max(0, liensEnCours - 1);

                } else {
                    if (tentative < maxTentatives) {
                        setTimeout(() => {
                            testerLienHttp(lien, taskCard, tentative + 1);
                        }, 2000);
                    } else {
                        if (overlay) {
                            overlay.querySelector('.text-collector').textContent = `Erreur ${response.status}`;
                            overlay.classList.add('http-co-error');
                        }
                        liensEnCours = Math.max(0, liensEnCours - 1);
                    }
                }
            },
            onerror: function () {
                if (tentative < maxTentatives) {
                    setTimeout(() => testerLienHttp(lien, taskCard, tentative + 1), 2000);
                } else {
                    const overlay = taskCard.querySelector(`#idreparation-status-${numeroReparation}`);
                    if (overlay) {
                        overlay.querySelector('.text-collector').textContent = `Erreur réseau`;
                        overlay.classList.add('http-error');
                    }
                    liensEnCours = Math.max(0, liensEnCours - 1);
                }
            }
        });
    }

})();