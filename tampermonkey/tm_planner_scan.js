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
        if (!location.href.includes("planner.cloud.microsoft")) {
            return; // Ne pas afficher le bouton si on n'est pas sur Microsoft Planner
        }

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
        container.style.textAlign = 'center';

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

        thumbnail.style.position = 'relative';
        thumbnail.appendChild(container);

        // Ajuste dynamiquement la hauteur du thumbnail
        setTimeout(() => {
            const hauteurOverlay = container.scrollHeight;
            const hauteurMin = Math.max(hauteurOverlay + 20, 100);
            thumbnail.style.minHeight = hauteurMin + 'px';
        }, 0);
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
                    if (texteLabel === 'non trouvé' && response.finalUrl?.includes('/Prm/AfficherPv/')) {
                        texteLabel = 'Terminé / PV';
                    }

                    const symbole = doc.getElementById('idSymbole')?.value?.trim() || 'non trouvé';
                    const idUser = doc.getElementById('idUser')?.value?.trim() || 'non trouvé';

                    const modificateur = extraireValeurParLibelle(doc, 'Dernière modif par :');
                    const dateModif    = extraireValeurParLibelle(doc, 'Date dernière modif :');
                    const infoAgent    = extraireValeurParLibelle(doc, 'Info Agent :');

                    const index = donneesTaches.findIndex(t => t.numeroReparation === numeroReparation);
                    const nouvelleTache = {
                        lien,
                        numeroReparation,
                        label: texteLabel,
                        idSymbole: symbole,
                        idUser: idUser,
                        modificateur,
                        dateModif,
                        infoAgent
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

                    const topBar = taskCard.querySelector('.topBar');
                    if (topBar) {
                        let infoBox = topBar.querySelector('.collector-infos');
                        if (!infoBox) {
                            infoBox = document.createElement('div');
                            infoBox.className = 'collector-infos';
                            infoBox.style.marginBottom = '15px';
                            infoBox.style.background = '#fdf8f0';
                            infoBox.style.border = '1px solid #f3ae6b';
                            infoBox.style.borderRadius = '4px';
                            infoBox.style.padding = '4px 6px';
                            infoBox.style.fontSize = '11px';
                            infoBox.style.lineHeight = '1.4';

                            // 🟠 Insérer AVANT le premier enfant de .topBar
                            topBar.insertBefore(infoBox, topBar.firstChild);
                        } else {
                            infoBox.innerHTML = '';
                        }

                        const addInfo = (label, val) => {
                            const span = document.createElement('span');
                            span.style.display = 'block';
                            span.innerHTML = `<strong>${label}</strong> ${val}`;
                            infoBox.appendChild(span);
                        };

                        addInfo('Modifié par :', modificateur);
                        addInfo('Date modif :', dateModif);
                        addInfo('Info Agent :', infoAgent);

                        masquerPlanProductionC();
                    }


                    liensEnCours = Math.max(0, liensEnCours - 1);

                } else {
                    if (tentative < maxTentatives) {
                        setTimeout(() => testerLienHttp(lien, taskCard, tentative + 1), 2000);
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

    function masquerPlanProductionC() {
        const plans = document.querySelectorAll('div.planName');

        for (const plan of plans) {
            if (plan.textContent.trim() === 'Production C') {
                plan.style.display = 'none';
            }
        }
    }

    function extraireValeurParLibelle(doc, libelle) {
        const spans = [...doc.querySelectorAll('span')];
        for (const span of spans) {
            if (span.textContent.trim() === libelle) {
                const parentDiv = span.closest('div');
                const container = parentDiv?.parentElement;
                if (container) {
                    const infos = container.querySelectorAll('div');
                    if (infos.length >= 2) {
                        const valeur = infos[1]?.textContent?.trim();
                        if (valeur) return valeur;
                    }
                }
            }
        }
        return 'non trouvé';
    }


})();
