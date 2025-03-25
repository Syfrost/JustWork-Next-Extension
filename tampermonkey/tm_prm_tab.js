(function () {
    'use strict';

    const lignesTraitées = new WeakSet();
    let boutonOuvertureAjouté = false;
    let boutonCollerAjouté = false;
    let boutonTraiterAjouté = false;

    function afficherIframe(pk, element) {
        const tr = element.closest('tr');
        const existingIframeRow = tr.nextElementSibling;

        if (existingIframeRow && existingIframeRow.classList.contains('iframe-row')) {
            return;
        }

        const newRow = document.createElement('tr');
        newRow.classList.add('iframe-row');

        const newCell = document.createElement('td');
        newCell.colSpan = tr.children.length;

        const iframe = document.createElement('iframe');
        iframe.src = `https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/${pk}.html`;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = '2px solid #444';
        iframe.style.marginTop = '10px';
        iframe.style.display = 'block';

        newCell.appendChild(iframe);
        newRow.appendChild(newCell);

        tr.parentNode.insertBefore(newRow, tr.nextSibling);
    }

    function scanTRs() {
        const table = document.getElementById('dataTablePrmFilles');
        if (!table) return;

        const lignes = table.querySelectorAll('tr[idreparation]');

        lignes.forEach(tr => {
            if (lignesTraitées.has(tr)) return;

            const idReparation = tr.getAttribute('idreparation');
            const existingLink = tr.querySelector('a.afficherIframe');

            if (!existingLink && idReparation) {
                const tds = tr.querySelectorAll('td');
                if (tds.length >= 3) {
                    const targetTd = tds[2];
                    targetTd.classList.add('noRedirect', 'noColvis', 'noExportable', 'noClick');

                    const lien = document.createElement('a');
                    lien.className = 'dropdown-item afficherIframe';
                    lien.setAttribute('pk', idReparation);
                    lien.innerHTML = '<!-- <i class="fas fa-eye"></i> -->Afficher ici';
                    lien.style.cursor = 'pointer';

                    targetTd.appendChild(lien);

                    lien.addEventListener('click', function (e) {
                        e.preventDefault();
                        afficherIframe(idReparation, this);
                    });
                }
            }

            lignesTraitées.add(tr);
        });

        if (!boutonOuvertureAjouté) {
            ajouterBoutonToutOuvrir();
            boutonOuvertureAjouté = true;
        }

        const iframesActives = document.querySelectorAll('tr.iframe-row iframe');

        if (iframesActives.length > 0) {
            ajouterBoutonCollerIframe();
            ajouterBoutonTraiterIframe();
        } else {
            retirerBouton("btnCollerIframeCRI");
            boutonCollerAjouté = false;

            retirerBouton("btnTraiterIframeCRI");
            boutonTraiterAjouté = false;
        }
    }

    function ajouterBoutonToutOuvrir() {
        const container = document.querySelector('#dataTablePrmFilles_wrapper .dt-buttons');
        if (!container) return;

        const bouton = document.createElement('button');
        bouton.className = 'btn btn-success btn-border-radius';
        bouton.innerHTML = '<span>Tout ouvrir</span>';
        bouton.style.marginLeft = '8px';
        bouton.title = 'Ouvrir toutes les réparations';

        bouton.addEventListener('click', () => {
            const liens = document.querySelectorAll('#dataTablePrmFilles a.afficherIframe');
            liens.forEach(lien => lien.click());
        });

        container.appendChild(bouton);
    }

    function ajouterBoutonCollerIframe() {
        const buttonContainer = getFloatingButtonContainer();
        if (!buttonContainer || document.getElementById("btnCollerIframeCRI")) return;

        const bouton = document.createElement("button");
        bouton.id = "btnCollerIframeCRI";
        bouton.innerText = "Coller Iframe";
        bouton.onclick = collerDansTousLesIframes;
        styleButton(bouton, "#17a2b8", "fa-paste");

        buttonContainer.prepend(bouton);
        boutonCollerAjouté = true;
    }

    function ajouterBoutonTraiterIframe() {
        const buttonContainer = getFloatingButtonContainer();
        if (!buttonContainer || document.getElementById("btnTraiterIframeCRI")) return;

        const bouton = document.createElement("button");
        bouton.id = "btnTraiterIframeCRI";
        bouton.innerText = "Traiter Iframe";
        bouton.onclick = traiterTousLesIframes;
        styleButton(bouton, "#007bff", "fa-bolt");

        buttonContainer.prepend(bouton);
        boutonTraiterAjouté = true;
    }

    function retirerBouton(id) {
        document.getElementById(id)?.remove();
    }

    function getFloatingButtonContainer() {
        return document.querySelector('div[style*="position: fixed;"][style*="bottom: 10px;"][style*="right: 10px;"]');
    }

    function styleButton(button, backgroundColor, iconClass) {
        button.style.margin = '5px';
        button.style.backgroundColor = backgroundColor;
        button.style.color = 'white';
        button.style.padding = '5px 10px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.innerHTML = `<i class='fa ${iconClass}'></i> ` + button.innerText;
    }

    function collerDansTousLesIframes() {
        const formData = JSON.parse(localStorage.getItem('formulaireCopie'));
        if (!formData) {
            alert("Aucune donnée à coller.");
            return;
        }

        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const formulaire = doc.querySelector('#panel-body-groupe_saisie_cri');
                if (!formulaire) return;

                formulaire.querySelectorAll('input, select, textarea').forEach((el) => {
                    if (el.tagName === 'SELECT') {
                        el.value = formData[el.name];

                        const btn = doc.querySelector(`button[data-id="${el.id}"]`);
                        const opt = el.querySelector(`option[value="${formData[el.name]}"]`);
                        const optionText = opt?.textContent?.trim() || '';
                        const filterOption = btn?.querySelector('.filter-option');
                        if (filterOption) {
                            filterOption.textContent = optionText;
                        }
                    }
                });
            } catch (err) {
                console.error("⚠️ Erreur accès iframe :", err);
            }
        });
    }

    function traiterTousLesIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const bouton = doc.querySelector('button[collector-form-name="SAISIE ETIQUETTE ROUGE (CT10)"]');
                if (bouton) {
                    bouton.click();
                    console.log("🟢 Clic sur bouton 'Traiter l'organe' dans une iframe");
                } else {
                    console.log("⚠️ Bouton 'Traiter l'organe' non trouvé dans une iframe");
                }
            } catch (err) {
                console.error("❌ Impossible d'interagir avec une iframe :", err);
            }
        });
    }

    setInterval(scanTRs, 1000);
})();
