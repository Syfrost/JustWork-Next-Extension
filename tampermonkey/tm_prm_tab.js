(function () {
    'use strict';

    const processedRows = new WeakSet();
    const iframeReloadAttempts = new WeakMap();

    function renderIframe(pk, element) {
        const row = element.closest('tr');
        const existingIframe = row.nextElementSibling;

        if (existingIframe && existingIframe.classList.contains('iframe-row')) return;

        const newRow = document.createElement('tr');
        newRow.classList.add('iframe-row');

        const cell = document.createElement('td');
        cell.colSpan = row.children.length;

        const iframe = document.createElement('iframe');
        iframe.src = `https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/${pk}.html`;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = '2px solid #444';
        iframe.style.marginTop = '10px';
        iframe.style.display = 'block';

        cell.appendChild(iframe);
        newRow.appendChild(cell);
        row.parentNode.insertBefore(newRow, row.nextSibling);
    }

    function monitorTable() {
        const table = document.getElementById('dataTablePrmFilles');
        if (!table) return;

        const rows = table.querySelectorAll('tr[idreparation]');
        rows.forEach(row => {
            if (processedRows.has(row)) return;

            const pk = row.getAttribute('idreparation');
            const existingLink = row.querySelector('a.openIframeLink');

            if (!existingLink && pk) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const targetCell = cells[2];
                    targetCell.classList.add('noRedirect', 'noColvis', 'noExportable', 'noClick');

                    const link = document.createElement('a');
                    link.className = 'dropdown-item openIframeLink';
                    link.setAttribute('pk', pk);
                    link.innerHTML = '<!-- <i class="fas fa-eye"></i> -->Afficher ici';
                    link.style.cursor = 'pointer';

                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        renderIframe(pk, this);
                    });

                    targetCell.appendChild(link);
                    console.log(`➕ Lien ajouté pour la réparation ${pk}`);
                }
            }

            processedRows.add(row);
        });

        const toolbar = document.querySelector('#dataTablePrmFilles_wrapper .dt-buttons');
        if (toolbar && !document.getElementById('btnOpenAllIframes')) {
            createOpenAllButton();
        }

        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        if (iframes.length > 0) {
            createPasteAllButton();
            createTriggerAllButton();
            hideElementsInIframes();
            checkRedirectErrorsInIframes();
        } else {
            removeFloatingButton('btnPasteAllIframes');
            removeFloatingButton('btnTriggerAllIframes');
        }
    }


    function createOpenAllButton() {
        const container = document.querySelector('#dataTablePrmFilles_wrapper .dt-buttons');
        if (!container) return;

        const button = document.createElement('button');
        button.id = 'btnOpenAllIframes';
        button.className = 'btn btn-success btn-border-radius';
        button.innerHTML = '<span>Tout ouvrir</span>';
        button.style.marginLeft = '8px';
        button.title = 'Ouvrir toutes les réparations';

        button.addEventListener('click', () => {
            const links = document.querySelectorAll('#dataTablePrmFilles a.openIframeLink');
            links.forEach(link => link.click());
            console.log(`▶️ ${links.length} iframe(s) ouvertes`);
        });

        container.appendChild(button);
        console.log('✅ Bouton "Tout ouvrir" ajouté');
    }

    function createPasteAllButton() {
        const container = getFloatingButtonArea();
        if (!container || document.getElementById("btnPasteAllIframes")) return;

        const button = document.createElement("button");
        button.id = "btnPasteAllIframes";
        button.innerText = "Coller Iframe";
        button.onclick = pasteIntoIframes;
        styleFloatingButton(button, "#17a2b8", "fa-paste");

        container.prepend(button);
        console.log("✅ Bouton 'Coller Iframe' ajouté");
    }

    function createTriggerAllButton() {
        const container = getFloatingButtonArea();
        if (!container || document.getElementById("btnTriggerAllIframes")) return;

        const button = document.createElement("button");
        button.id = "btnTriggerAllIframes";
        button.innerText = "Traiter Iframe";
        button.onclick = triggerButtonsInIframes;
        styleFloatingButton(button, "#007bff", "fa-bolt");

        container.prepend(button);
        console.log("✅ Bouton 'Traiter Iframe' ajouté");
    }

    function removeFloatingButton(id) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.remove();
            console.log(`❌ Bouton '${id}' retiré`);
        }
    }

    function getFloatingButtonArea() {
        return document.querySelector('div[style*="position: fixed;"][style*="bottom: 10px;"][style*="right: 10px;"]');
    }

    function styleFloatingButton(button, backgroundColor, iconClass) {
        button.style.margin = '5px';
        button.style.backgroundColor = backgroundColor;
        button.style.color = 'white';
        button.style.padding = '5px 10px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.innerHTML = `<i class='fa ${iconClass}'></i> ` + button.innerText;
    }

    function pasteIntoIframes() {
        const formData = JSON.parse(localStorage.getItem('formulaireCopie'));
        if (!formData) {
            alert("Aucune donnée à coller. Veuillez copier un formulaire d'abord.");
            return;
        }

        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const form = doc.querySelector('#panel-body-groupe_saisie_cri');
                if (!form) return;

                form.querySelectorAll('input, select, textarea').forEach((el) => {
                    if (el.tagName === 'SELECT') {
                        el.value = formData[el.name];

                        const selectBtn = doc.querySelector(`button[data-id="${el.id}"]`);
                        const selectedOpt = el.querySelector(`option[value="${formData[el.name]}"]`);
                        const text = selectedOpt?.textContent?.trim() || '';
                        const filter = selectBtn?.querySelector('.filter-option');
                        if (filter) {
                            filter.textContent = text;
                        }
                    } else {
                        el.value = formData[el.name] || '';
                    }
                });

                console.log("✅ Formulaire collé dans une iframe");
            } catch (err) {
                console.error("⚠️ Erreur d'accès à une iframe :", err);
            }
        });
    }

    function triggerButtonsInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const button = doc.querySelector('button[collector-form-name="SAISIE ETIQUETTE ROUGE (CT10)"]');
                if (button) {
                    button.click();
                    console.log("🟢 Clic sur 'Traiter l'organe' dans une iframe");
                } else {
                    console.log("⚠️ Bouton 'Traiter l'organe' non trouvé dans une iframe");
                }
            } catch (err) {
                console.error("❌ Impossible d'interagir avec une iframe :", err);
            }
        });
    }

    setInterval(monitorTable, 1000);

    function hideElementsInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;

                const panel = doc.getElementById('repair_details_panel');
                if (panel) {
                    panel.style.display = 'none';
                    console.log("🙈 'repair_details_panel' masqué dans une iframe");
                }

            } catch (err) {
                console.error("❌ Impossible d'accéder à une iframe :", err);
            }
        });
    }
    function checkRedirectErrorsInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const bodyText = doc.body?.innerText || '';
                const titleText = doc.title || '';

                const isRedirectError = bodyText.includes("vous a redirigé à de trop nombreuses reprises")
                || titleText.toLowerCase().includes("redirigé");

                if (isRedirectError) {
                    const currentAttempts = iframeReloadAttempts.get(iframe) || 0;

                    if (currentAttempts >= 10) {
                        console.error("❌ Trop de tentatives de reload pour cette iframe. Abandon après 10 essais.");
                        return;
                    }

                    console.warn(`🔁 Redirection détectée (tentative ${currentAttempts + 1}/10). Reload dans 2s...`);

                    setTimeout(() => {
                        iframe.contentWindow.location.reload();
                        iframeReloadAttempts.set(iframe, currentAttempts + 1);
                        console.log("🔄 Iframe rechargée.");
                    }, 2000);
                }

            } catch (err) {
                console.error("❌ Erreur d'accès à une iframe :", err);
            }
        });
    }

})();
