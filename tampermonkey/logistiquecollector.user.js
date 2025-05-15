// ==UserScript==
// @name         Auto post collector cri
// @namespace    https://github.com/Syfrost/JustWork-Next-Extension
// @version      1.8
// @description  Surcouche planner
// @author       Cedric G
// @match        https://planner.cloud.microsoft/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      prod.cloud-collectorplus.mt.sncf.fr
// @updateURL    https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/logistiquecollector.user.js
// @downloadURL  https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/logistiquecollector.user.js
// ==/UserScript==

(function () {
    'use strict';

    const processedSections = new WeakMap();
    const donneesTaches = []; // tableau global pour stocker les infos extraites
    let liensEnCours = 0;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ajouterBoutonAutoCollector);
    } else {
        ajouterBoutonAutoCollector();
    }

    GM_addStyle(`
.autoelement {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
    border-radius: 13px;
    /*border: 3px solid rgb(255, 115, 0);*/
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    padding: 5px;
}
.autoelement__img__container {
    display: block;
    position: relative;
    padding: 4px 4px 4px 4px;
    margin: 0;
    width: auto;
    height: auto;
    border-radius: 50px;
    overflow: hidden;
}
.autoelement__img__source {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 25px !important;
    height: 20px !important;
    overflow: hidden;
}
.autoelement__text {
    padding-right: 5px;
    color: antiquewhite;
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
    font-size: 0.8rem;
}

.http-co-error {
    animation: soundwave 2s ease infinite;
    border: 1px solid red !important;
}

.hidden {
    display: none;
}

.autocollector {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex-direction: column;
    row-gap: 10px;
}

.autocollector__button {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 25px;
    border: 2px solid rgb(250, 90, 26);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    padding: 5px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: grab;
}

.autocollector__button:hover {
    transform: scale(1.05);
    /*box-shadow: 0 0 5px rgb(255, 115, 0), 0 0 5px rgb(255, 115, 0), 0 0 5px rgb(255, 115, 0);
*/
    }

.autocollector__button-icon {
    display: block;
    position: relative;
    padding: 0px 4px 0px 2px;
    margin: 0;
    width: 25px;
    height: 20px;
    border-radius: 0px;
    overflow: hidden;
    /*background: rgba(0, 0, 0, 0.35);*/
}

.autocollector__button-text {
    padding-right: 5px;
    color: antiquewhite;
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
    font-size: 1rem;
}

.autocollector__progress {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 25px;
    border: 2px solid rgb(250, 90, 26);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
    padding: 5px;
    color: antiquewhite;
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
    font-size: 0.8rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: not-allowed;
}

@keyframes soundwave {
    0% {
        box-shadow: 0 0 0 0px rgba(255, 0, 0, 0.75);
    }

    100% {
        box-shadow: 0 0 0 25px rgba(255, 255, 255, 0);
    }
}
    `);
    injecterPoliceMontserrat();

    function injecterPoliceMontserrat() {
        if (!document.getElementById('font')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css?family=Montserrat:300,400,700,900&display=swap';
            link.id = 'font';
            document.head.appendChild(link);
            console.log('🔤 Police Montserrat injectée.');
        }
    }

    function updateProgressBarFromDonneesTaches() {
        const progressContainer = document.querySelector('.autocollector__progress');
        const progressText = progressContainer?.querySelector('.autocollector__progress-text');
        if (!progressContainer || !progressText) return;

        const total = donneesTaches.filter(t => t.label === 'ELECTRONIQUE - 00 - EN ATTENTE').length;
        if (total === 0) {
            progressContainer.classList.add('hidden');
        } else {
            progressContainer.classList.remove('hidden');
        }

        progressText.textContent = `0/${total}`;
    }


    function ajouterBoutonAutoCollector() {
        const container = document.createElement('div');
        container.className = 'autocollector';

        container.innerHTML = `
        <div class="autocollector__progress hidden">
            <span class="autocollector__progress-text">0/0</span>
        </div>
        <div class="autocollector__button">
            <img src="https://prod.cloud-collectorplus.mt.sncf.fr/assets/images/sprite_src/pictos/Collector_accueil.png"
                 alt="Icon"
                 class="autocollector__button-icon">
            <span class="autocollector__button-text">Lancer mode auto collector</span>
        </div>
    `;

        document.body.appendChild(container);

        // Clic sur le bouton : lancer le traitement automatique
        container.querySelector('.autocollector__button').addEventListener('click', () => {
            lancerModeAutoCollector();
        });
    }

    function lancerModeAutoCollector() {
        const progressContainer = document.querySelector('.autocollector__progress');
        const progressText = progressContainer.querySelector('.autocollector__progress-text');

        const tachesAFaire = donneesTaches.filter(t =>
                                                  t.label === 'ELECTRONIQUE - 00 - EN ATTENTE'
                                                 );

        if (tachesAFaire.length === 0) {
            alert('Aucune tâche éligible trouvée.');
            return;
        }

        progressContainer.classList.remove('hidden');
        let total = tachesAFaire.length;
        let done = 0;
        let erreurs = 0;
        let postRestants = total;

        function updateProgress() {
            progressText.textContent = `${done}/${total}${erreurs > 0 ? ` (${erreurs} erreur${erreurs > 1 ? 's' : ''})` : ''}`;
        }

        updateProgress();

        tachesAFaire.forEach(tache => {
            const payload = new URLSearchParams({
                S_num_cri: '',
                t_materiel_idt_materiel: '',
                t_site_intervention_idt_site_intervention: '',
                fk_cause_depose: '',
                D_date_eve: '',
                S_num_rame: '',
                S_num_veh: '',
                I_kilometrage: '',
                S_commentaire: '',
                form_id: 'Saisie_CRI',
                transition_id: '268',
                idSymbole: tache.idSymbole,
                idUser: tache.idUser,
                current_repair_id: tache.numeroReparation
            }).toString();

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/processTransitionForm',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: payload,
                onload: res => {
                    if (res.status === 200) {
                        done++;
                    } else {
                        erreurs++;
                    }
                    postRestants--;
                    updateProgress();
                    if (postRestants === 0) {
                        console.log('🎯 Toutes les requêtes POST terminées. Rafraîchissement en cours...');
                        // Rafraîchissement des tâches
                        setTimeout(() => {
                            tachesAFaire.forEach(tache => {
                                const taskCard = document.querySelector(`#idreparation-status-${tache.numeroReparation}`)?.closest('.taskCard');
                                if (taskCard) {
                                    const overlay = taskCard.querySelector(`#idreparation-status-${tache.numeroReparation}`);
                                    if (overlay) {
                                        overlay.querySelector('.text-collector').textContent = 'Rafraîchissement...';
                                    }
                                    testerLienHttp(tache.lien, taskCard);
                                }
                            });
                        }, 1000);
                    }
                },
                onerror: () => {
                    erreurs++;
                    postRestants--;
                    updateProgress();
                    if (postRestants === 0) {
                        console.log('🎯 Toutes les requêtes POST terminées (avec erreurs). Rafraîchissement en cours...');
                        setTimeout(() => {
                            tachesAFaire.forEach(tache => {
                                const taskCard = document.querySelector(`#idreparation-status-${tache.numeroReparation}`)?.closest('.taskCard');
                                if (taskCard) {
                                    const overlay = taskCard.querySelector(`#idreparation-status-${tache.numeroReparation}`);
                                    if (overlay) {
                                        overlay.querySelector('.text-collector').textContent = 'Rafraîchissement...';
                                    }
                                    testerLienHttp(tache.lien, taskCard);
                                }
                            });
                        }, 1000);
                    }
                }
            });
        });
    }

    console.log('[Planner Script] Démarrage avec requêtes GET...');

    function updateAutoCollectorButtonState() {
        const btn = document.querySelector('.autocollector__button');
        const label = btn?.querySelector('.autocollector__button-text');
        if (!btn || !label) return;

        if (liensEnCours > 0) {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
            label.textContent = 'Analyse en cours...';
        } else {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            label.textContent = 'Lancer mode auto collector';
        }
    }

    function forcerChargementCompletDesTaches(section) {
        const scrollable = section.closest('.scrollable[data-can-drag-to-scroll="true"]');
        const listBox = section.querySelector('.listBoxGroup');
        const compteurElement = section.querySelector('.sectionItemCount');

        if (!scrollable || !listBox || !compteurElement) return;

        const totalAttendu = parseInt(compteurElement.textContent.trim(), 10) || 0;
        let previousCount = 0;
        let essais = 0;
        const maxEssais = 30;

        console.log(`🔽 Scroll auto lancé — Objectif : ${totalAttendu} tâches`);

        const interval = setInterval(() => {
            scrollable.scrollTop = scrollable.scrollHeight;

            const currentCount = listBox.querySelectorAll('.taskBoardCard').length;
            essais++;

            if (currentCount >= totalAttendu) {
                clearInterval(interval);
                console.log(`✅ Chargement complet : ${currentCount}/${totalAttendu} tâches visibles.`);
            } else if (currentCount === previousCount || essais >= maxEssais) {
                clearInterval(interval);
                console.warn(`⚠️ Arrêt forcé : ${currentCount}/${totalAttendu} tâches visibles après ${essais} essais.`);
            } else {
                previousCount = currentCount;
                console.log(`🔄 Scroll ${essais}... ${currentCount}/${totalAttendu} tâches visibles`);
            }
        }, 600);
    }




    function testerLienHttp(lien, taskCard, tentative = 1) {
        liensEnCours++;
        updateAutoCollectorButtonState();

        const maxTentatives = 5;
        const numeroReparation = lien.match(/\/(\d+)\.html$/)?.[1] || 'inconnu';

        GM_xmlhttpRequest({
            method: 'GET',
            url: lien,
            onload: function (response) {
                console.log(`🔍 Tentative ${tentative} pour [${lien}] → Status HTTP: ${response.status}`);

                const overlay = taskCard.querySelector(`#idreparation-status-${numeroReparation}`);

                if (response.status === 200) {
                    const html = response.responseText;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const label = doc.querySelector('span.label-success');
                    const texteLabel = label?.textContent?.trim() || 'non trouvé';

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
                        console.log(`♻️ Tâche ${numeroReparation} mise à jour`);
                    } else {
                        donneesTaches.push(nouvelleTache);
                        console.log(`➕ Nouvelle tâche ${numeroReparation} ajoutée`);
                    }

                    updateProgressBarFromDonneesTaches();

                    console.log(`✅ Tâche analysée :`);
                    console.log(`   🔧 Réparation : ${numeroReparation}`);
                    console.log(`   🏷️ Label      : ${texteLabel}`);
                    console.log(`   🆔 idSymbole  : ${symbole}`);
                    console.log(`   👤 idUser     : ${idUser}`);
                    console.log(`   🔗 Lien       : ${lien}`);

                    if (overlay) {
                        overlay.querySelector('.text-collector').textContent = texteLabel;
                        overlay.querySelector('.text-numeroreparation').textContent = numeroReparation;
                        overlay.classList.remove('http-error');
                    }

                    // Fin du traitement réussi
                    liensEnCours = Math.max(0, liensEnCours - 1);
                    updateAutoCollectorButtonState();

                } else {
                    if (overlay) {
                        if (tentative >= maxTentatives) {
                            overlay.querySelector('.text-collector').textContent = `Erreur ${response.status}`;
                            overlay.classList.add('http-co-error');
                        } else {
                            overlay.querySelector('.text-collector').textContent = `Erreur ${response.status} (tentative ${tentative})`;
                        }
                    }

                    if (tentative < maxTentatives) {
                        setTimeout(() => {
                            testerLienHttp(lien, taskCard, tentative + 1);
                        }, 2000);
                    } else {
                        console.warn(`❌ Échec après ${maxTentatives} tentatives pour ${lien}`);
                        liensEnCours = Math.max(0, liensEnCours - 1);
                        updateAutoCollectorButtonState();
                    }
                }
            },
            onerror: function (error) {
                const overlay = taskCard.querySelector(`#idreparation-status-${numeroReparation}`);

                if (overlay) {
                    if (tentative >= maxTentatives) {
                        overlay.querySelector('.text-collector').textContent = `Erreur réseau`;
                        overlay.classList.add('http-error');
                    } else {
                        overlay.querySelector('.text-collector').textContent = `Erreur réseau (tentative ${tentative})`;
                    }
                }

                if (tentative < maxTentatives) {
                    setTimeout(() => {
                        testerLienHttp(lien, taskCard, tentative + 1);
                    }, 2000);
                } else {
                    console.error(`❌ Échec réseau après ${maxTentatives} tentatives :`, error);
                    liensEnCours = Math.max(0, liensEnCours - 1);
                    updateAutoCollectorButtonState();
                }
            }
        });
    }






    function extraireTachesDepuisSection(section) {
        const bouton = section.querySelector('button.sectionToggleButton');
        const titre = bouton?.querySelector('h4.toggleText');

        if (titre?.textContent?.trim() !== 'Tâches terminées') return;

        const estOuvert = bouton.getAttribute('aria-expanded') === 'true';

        if (estOuvert && !processedSections.get(section)) {
            console.log('✅ Section "Tâches terminées" OUVERTE → En attente du rendu...');
            processedSections.set(section, true);
            forcerChargementCompletDesTaches(section);
            observerAjoutTachesDansSection(section);

            // Attendre un court instant pour que les tâches se chargent
            setTimeout(() => {
                const taches = section.querySelectorAll('div.taskBoardCard');

                if (!taches.length) {
                    console.warn('⚠️ Aucune tâche trouvée dans cette section. Peut-être encore en chargement ou vide.');
                    return;
                }

                taches.forEach(tache => {
                    const taskCard = tache.querySelector('div.taskCard');
                    if (!taskCard) {
                        console.warn('❌ taskCard manquant pour une tâche détectée.');
                        return;
                    }

                    const lienElement = taskCard.querySelector('a.referencePreviewDescription');
                    let lien = lienElement?.getAttribute('title')?.trim();
                    if (lien && !lien.endsWith('.html')) {
                        lien += '.html';
                    }

                    if (lien) {
                        console.log('📝 Tâche détectée avec lien :', lien);
                        const numeroReparation = lien.match(/\/(\d+)(?:\.html)?$/)?.[1] || 'inconnu';
                        ajouterOverlayTaskCard(taskCard, numeroReparation, 'Chargement...');
                        testerLienHttp(lien, taskCard);
                    } else {
                        console.warn('❌ Lien manquant (balise <a> absente ou invalide) dans cette taskCard.');
                    }
                });
            }, 500); // ← délai ajustable (500ms est souvent suffisant)
        }

        if (!estOuvert && processedSections.get(section)) {
            console.log('🔁 Section refermée. Réinitialisation autorisée.');
            processedSections.set(section, false);
        }
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

    function observerDisparitionSectionsTachesTerminees() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.removedNodes.forEach(node => {
                    if (
                        node.nodeType === 1 &&
                        node.matches('.secondarySection')
                    ) {
                        const titre = node.querySelector('h4.toggleText')?.textContent?.trim();
                        if (titre === 'Tâches terminées') {
                            console.log('🗑️ Section "Tâches terminées" retirée du DOM');

                            // Supprimer toutes les tâches associées à cette section
                            const cards = node.querySelectorAll('div.taskBoardCard');
                            cards.forEach(card => {
                                const lien = card.querySelector('span.previewCaption')?.textContent?.trim();
                                const numero = lien?.match(/\/(\d+)\.html$/)?.[1];
                                if (numero) {
                                    const index = donneesTaches.findIndex(t => t.numeroReparation === numero);
                                    if (index !== -1) {
                                        donneesTaches.splice(index, 1);
                                        console.log(`🗑️ Tâche ${numero} supprimée (section supprimée)`);
                                    }
                                }
                            });
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('👁️ Observer global actif pour suppression de sections "Tâches terminées".');
    }


    function observerAjoutTachesDansSection(section) {
        const container = section.querySelector('.listWrapper');
        if (!container) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {

                // ✅ Tâches ajoutées dynamiquement
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches('.taskBoardCard')) {
                        const taskCard = node.querySelector('div.taskCard');
                        if (!taskCard) return;

                        const lienElement = taskCard.querySelector('a.referencePreviewDescription');
                        let lien = lienElement?.getAttribute('title')?.trim();
                        if (lien && !lien.endsWith('.html')) {
                            lien += '.html';
                        }
                        const numeroReparation = lien?.match(/\/(\d+)\.html$/)?.[1];

                        if (lien && numeroReparation) {
                            console.log('🆕 Nouvelle tâche ajoutée dynamiquement :', lien);
                            ajouterOverlayTaskCard(taskCard, numeroReparation, 'Chargement...');
                            testerLienHttp(lien, taskCard);
                        }
                    }
                });

                // 🗑️ Tâches supprimées dynamiquement
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches('.taskBoardCard')) {
                        const taskCard = node.querySelector('div.taskCard');
                        if (!taskCard) return;

                        const lienElement = taskCard.querySelector('a.referencePreviewDescription');
                        let lien = lienElement?.getAttribute('title')?.trim();
                        if (lien && !lien.endsWith('.html')) {
                            lien += '.html';
                        }
                        const numeroReparation = lien?.match(/\/(\d+)\.html$/)?.[1];

                        if (numeroReparation) {
                            const index = donneesTaches.findIndex(t => t.numeroReparation === numeroReparation);
                            if (index !== -1) {
                                donneesTaches.splice(index, 1);
                                console.log(`🗑️ Tâche retirée : ${numeroReparation} supprimée de donneesTaches`);
                            }
                        }
                    }
                });

            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });

        console.log('👀 Observer actif sur ajouts/suppressions dynamiques dans cette section "Tâches terminées".');
    }

    function observerOuvertureSections() {
        const cible = document.body;

        const observer = new MutationObserver(() => {
            const sections = document.querySelectorAll('div.secondarySection');

            sections.forEach(section => {
                const bouton = section.querySelector('button.sectionToggleButton');
                const titre = bouton?.querySelector('h4.toggleText');

                if (titre?.textContent?.trim() === 'Tâches terminées') {
                    extraireTachesDepuisSection(section);
                }
            });
        });

        observer.observe(cible, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-expanded'],
        });

        console.log('[Planner Script] Observer actif pour surveiller les ouvertures.');
    }

    setTimeout(() => {
        observerOuvertureSections();
        observerDisparitionSectionsTachesTerminees();
    }, 2000);

})();
