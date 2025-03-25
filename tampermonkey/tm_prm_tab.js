(function () {
    'use strict';

    const lignesTraitées = new WeakSet();
    let boutonAjouté = false;

    function afficherIframe(pk, element) {
        const tr = element.closest('tr');
        const existingIframeRow = tr.nextElementSibling;

        if (existingIframeRow && existingIframeRow.classList.contains('iframe-row')) {
            return; // déjà ouvert, ne rien faire
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
        if (!table) {
            console.log('⏳ Table #dataTablePrmFilles non trouvée...');
            return;
        }

        const lignes = table.querySelectorAll('tr[idreparation]');
        if (lignes.length > 0) {
            console.log(`📦 ${lignes.length} ligne(s) détectée(s)`);
        }

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

                    console.log(`➕ Lien ajouté pour idreparation=${idReparation}`);
                }
            }

            lignesTraitées.add(tr);
        });

        // Ajouter le bouton une seule fois
        if (!boutonAjouté) {
            ajouterBoutonToutOuvrir();
            boutonAjouté = true;
        }
    }

    function ajouterBoutonToutOuvrir() {
        const container = document.querySelector('#dataTablePrmFilles_wrapper .dt-buttons');
        if (!container) {
            console.warn('⚠️ Conteneur des boutons non trouvé');
            return;
        }

        const bouton = document.createElement('button');
        bouton.className = 'btn btn-success btn-border-radius';
        bouton.innerHTML = '<span>Tout ouvrir</span>';
        bouton.title = 'Ouvrir toutes les réparations dans des iframes';
        bouton.style.marginLeft = '8px';

        bouton.addEventListener('click', () => {
            const liens = document.querySelectorAll('#dataTablePrmFilles a.afficherIframe');
            console.log(`▶️ Ouverture de ${liens.length} iframe(s)`);
            liens.forEach(lien => {
                lien.click(); // Simule le clic pour ouvrir l’iframe
            });
        });

        container.appendChild(bouton);
        console.log('✅ Bouton "Tout ouvrir" ajouté');
    }

    // Scan toutes les secondes
    setInterval(scanTRs, 1000);
})();
