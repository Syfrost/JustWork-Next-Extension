// ==UserScript==
// @name         Auto Fill Input
// @namespace    https://github.com/Syfrost
// @version      1.25
// @description  Auto fill input
// @author       Cedric G
// @match        https://apps.powerapps.com/play/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/0e7d5c481b9ee0bd9364cbf8293ab6b47c887181/tampermonkey/fca_auto_fill.user.js
// @downloadURL  https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/0e7d5c481b9ee0bd9364cbf8293ab6b47c887181/tampermonkey/fca_auto_fill.user.js
// @homepageURL  https://github.com/Syfrost
// @supportURL   https://github.com/Syfrost/JustWork-Next-Extension/issues
// ==/UserScript==


(function() {
    'use strict';

    // Define your values
    let numREL = 'test';
    let numSer = '';
    let symbole = '';
    let designation = '';
    let originalLink = '';
    let commentCri = '';

    function fillPowerAppsInput(selector, value) {
        const input = unsafeWindow.document.querySelector(selector);
        if (input) {
            input.value = value;
            input.dispatchEvent(new unsafeWindow.Event('input', { bubbles: true }));
            input.dispatchEvent(new unsafeWindow.Event('change', { bubbles: true }));
        }
    }

    function fillInput() {
        fillPowerAppsInput("input[appmagic-control='TextInput20textbox']", numREL);
        fillPowerAppsInput("input[appmagic-control='TextInput20_2textbox']", numSer);
        fillPowerAppsInput("input[appmagic-control='TextInput13_2textbox']", symbole);
        fillPowerAppsInput("input[appmagic-control='TextInput2_8textbox']", designation);
        fillPowerAppsInput("input[appmagic-control='TextInput2_11textbox']", originalLink);
        fillPowerAppsInput("input[appmagic-control='TextInput2_6textbox']", commentCri);
    }

    // Try to fill immediately
    fillInput();

    // Also try after DOM changes
    const observer = new unsafeWindow.MutationObserver(() => {
        fillInput();
    });

    observer.observe(unsafeWindow.document.body, {
        childList: true,
        subtree: true
    });

    // Create UI panel for input modification
    function createUIPanel() {
        const panel = unsafeWindow.document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: white;
            border: 2px solid #333;
            padding: 15px;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        panel.innerHTML = `
            <input type="text" id="collectorLink" placeholder="Lien CollectorPlus" style="width: 100%; margin: 5px 0;">
            <button id="fetchData" style="width: 100%; padding: 8px; margin: 5px 0;">Récupérer données</button>
            <button id="toggleEdit" style="width: 100%; padding: 8px; margin: 5px 0;">Edit</button>
            <div id="editSection" style="display: none;">
            <hr>
            <label>Numéro REL:</label>
            <input type="text" id="manualNumREL" value="${numREL}" style="width: 100%; margin: 5px 0;">
            <label>Numéro Série:</label>
            <input type="text" id="manualNumSer" value="${numSer}" style="width: 100%; margin: 5px 0;">
            <label>Symbole:</label>
            <input type="text" id="manualSymbole" value="${symbole}" style="width: 100%; margin: 5px 0;">
            <label>Désignation:</label>
            <input type="text" id="manualDesignation" value="${designation}" style="width: 100%; margin: 5px 0;">
            <label>Lien Original:</label>
            <input type="text" id="manualOriginalLink" value="${originalLink}" style="width: 100%; margin: 5px 0;">
            <button id="updateValues" style="width: 100%; padding: 8px; margin: 5px 0;">Mettre à jour</button>
            </div>
        `;

        unsafeWindow.document.body.appendChild(panel);

        // Toggle edit section
        unsafeWindow.document.getElementById('toggleEdit').addEventListener('click', () => {
            const editSection = unsafeWindow.document.getElementById('editSection');
            editSection.style.display = editSection.style.display === 'none' ? 'block' : 'none';
        });

        // Update values function
        function updateConstants(newNumREL, newNumSer, newSymbole, newDesignation, newCommentCri = '', newOriginalLink = '') {
            numREL = newNumREL;
            numSer = newNumSer;
            symbole = newSymbole;
            designation = newDesignation;
            if (newCommentCri) commentCri = newCommentCri;
            if (newOriginalLink) originalLink = newOriginalLink;

            // Update UI inputs
            unsafeWindow.document.getElementById('manualNumREL').value = numREL;
            unsafeWindow.document.getElementById('manualNumSer').value = numSer;
            unsafeWindow.document.getElementById('manualSymbole').value = symbole;
            unsafeWindow.document.getElementById('manualDesignation').value = designation;
            unsafeWindow.document.getElementById('manualOriginalLink').value = originalLink;

            fillInput();
        }

        // Manual update button
        unsafeWindow.document.getElementById('updateValues').addEventListener('click', () => {
            const newNumREL = unsafeWindow.document.getElementById('manualNumREL').value;
            const newNumSer = unsafeWindow.document.getElementById('manualNumSer').value;
            const newSymbole = unsafeWindow.document.getElementById('manualSymbole').value;
            const newDesignation = unsafeWindow.document.getElementById('manualDesignation').value;
            const newOriginalLink = unsafeWindow.document.getElementById('manualOriginalLink').value;

            updateConstants(newNumREL, newNumSer, newSymbole, newDesignation, newOriginalLink);
        });

        // Collector fetch button
        const input = unsafeWindow.document.getElementById('collectorLink');
        const button = unsafeWindow.document.getElementById('fetchData');

        button.addEventListener('click', () => {
            let lien = input.value.trim();
            const originalLinkValue = lien;
            originalLink = originalLinkValue;
            if (!lien) return alert("Merci de mettre le lien CollectorPlus");

            lien = lien.replace(/^.*\/(\d+)(\.html)?$/, '$1');

            const urlImpression = `https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Impression/print/PV/${lien}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: urlImpression,
                onload: function(resp) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(resp.responseText, 'text/html');

                    const h1 = doc.querySelector('h1.border-bottom.text-center.mx-auto.mt-4.text-info.border-info');
                    let newSymbole = "";
                    let newDesignation = "";
                    if (h1) {
                        const txt = h1.textContent.trim();
                        const parts = txt.split(' - ');
                        newSymbole = parts[0] ? parts[0].trim() : "";
                        newDesignation = parts[1] ? parts[1].trim() : "";
                    }

                    let newNumSer = "";
                    const serieBlock = Array.from(doc.querySelectorAll('div.d-flex.flex-row'))
                        .find(div => div.textContent.includes("Numéro de série :"));
                    if (serieBlock) {
                        const valueDiv = serieBlock.querySelector('.ml-3');
                        if (valueDiv) newNumSer = valueDiv.textContent.trim();
                    }

                    let newNumREL = "";
                    const relBlock = Array.from(doc.querySelectorAll('div.d-flex.flex-row'))
                        .find(div => div.textContent.includes("Numéro FCA :"));
                    if (relBlock) {
                        const valueDiv = relBlock.querySelector('.ml-3');
                        if (valueDiv) newNumREL = valueDiv.textContent.trim();
                    }

                    let commentCri = "";
                    const commentBlock = Array.from(doc.querySelectorAll('div.d-flex.flex-row'))
                        .find(div => {
                            const boldDiv = div.querySelector('div.font-weight-bold');
                            return boldDiv && boldDiv.textContent.includes("Commentaire :");
                        });
                    if (commentBlock) {
                        const valueDiv = commentBlock.querySelector('.ml-3');
                        if (valueDiv) commentCri = valueDiv.textContent.trim();
                    }

                    updateConstants(newNumREL, newNumSer, newSymbole, newDesignation, commentCri);
                    //alert(`Données récupérées:\nSymbole: ${newSymbole}\nDésignation: ${newDesignation}\nNuméro de série: ${newNumSer}\nNuméro REL: ${newNumREL}`);
                },
                onerror: () => alert("Erreur HTTP lors de la récupération du CollectorPlus")
            });
        });
    }

    // Only create UI panel if in iframe and "Formulaire FCA" text is found
    if (unsafeWindow !== unsafeWindow.top) {
        const observer = new unsafeWindow.MutationObserver(() => {
            const walker = unsafeWindow.document.createTreeWalker(
                unsafeWindow.document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let foundFormulaireFCA = false;
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.includes('Formulaire FCA')) {
                    foundFormulaireFCA = true;
                    break;
                }
            }

            const existingPanel = unsafeWindow.document.querySelector('[data-autofill-panel]');

            if (foundFormulaireFCA && !existingPanel) {
                createUIPanel();
                // Mark panel as created to avoid duplicates
                const panel = unsafeWindow.document.querySelector('div[style*="position: fixed"]');
                if (panel) panel.setAttribute('data-autofill-panel', 'true');
            } else if (!foundFormulaireFCA && existingPanel) {
                // Remove UI panel if "Formulaire FCA" is no longer detected
                existingPanel.remove();
            }
        });

        observer.observe(unsafeWindow.document.body, {
            childList: true,
            subtree: true
        });

        // Also check immediately if content is already loaded
        setTimeout(() => {
            const walker = unsafeWindow.document.createTreeWalker(
                unsafeWindow.document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let foundFormulaireFCA = false;
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.includes('Formulaire FCA')) {
                    foundFormulaireFCA = true;
                    break;
                }
            }

            if (foundFormulaireFCA) {
                createUIPanel();
            }
        }, 1000);
    }
})();
