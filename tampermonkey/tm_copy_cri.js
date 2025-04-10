(function () {
    'use strict';

    document.addEventListener("DOMContentLoaded", verifierPresenceTitre);

    let formDataCRI = null; // Stockage temporaire en mémoire

    function verifierPresenceTitre() {
        return document.querySelector('.control-label')?.textContent.includes("Numéro du CRI ou de l'incident train");
    }

    let intervalCheck = setInterval(() => {
        if (verifierPresenceTitre()) {
            ajouterBoutons();
        } else {
            retirerBoutons();
        }
    }, 1000);

    function ajouterBoutons() {
        const buttonContainer = document.querySelector('div[style*="position: fixed;"][style*="bottom: 10px;"][style*="right: 10px;"]');
        if (!buttonContainer || document.getElementById("btnCopierCRI")) {
            return;
        }

        let btnCopier = document.createElement("button");
        btnCopier.id = "btnCopierCRI";
        btnCopier.innerText = "Copier CRI";
        btnCopier.onclick = copierFormulaireCRI;
        styleButton(btnCopier, "#6c757d", "fa-copy");

        let btnColler = document.createElement("button");
        btnColler.id = "btnCollerCRI";
        btnColler.innerText = "Coller CRI";
        btnColler.onclick = collerFormulaireCRI;
        styleButton(btnColler, "#6c757d", "fa-paste");

        buttonContainer.prepend(btnColler);
        buttonContainer.prepend(btnCopier);
    }

    function retirerBoutons() {
        document.getElementById("btnCopierCRI")?.remove();
        document.getElementById("btnCollerCRI")?.remove();
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

    function copierFormulaireCRI() {
        const formulaire = document.querySelector('#panel-body-groupe_saisie_cri');
        if (!formulaire) {
            alert('Formulaire non trouvé sur cette page.');
            return;
        }

        const formData = {};
        formulaire.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.tagName === 'SELECT') {
                formData[element.name] = element.value;
            } else {
                formData[element.name] = element.value;
            }
        });

        localStorage.setItem('formulaireCopie', JSON.stringify(formData));
        alert('Formulaire copié avec succès dans le stockage local !');
    }

    function collerFormulaireCRI() {
        const formulaire = document.querySelector('#panel-body-groupe_saisie_cri');
        if (!formulaire) {
            alert('Formulaire non trouvé sur cette page.');
            return;
        }

        const formData = JSON.parse(localStorage.getItem('formulaireCopie'));
        if (!formData) {
            alert('Aucune donnée à coller. Copiez un formulaire d\'abord.');
            return;
        }

        formulaire.querySelectorAll('input, select, textarea').forEach((element) => {
            if (formData[element.name] !== undefined) {
                if (element.tagName === 'SELECT') {
                    element.value = formData[element.name];
                    const bootstrapSelectButton = document.querySelector(`button[data-id="${element.id}"]`);
                    if (bootstrapSelectButton) {
                        const optionText = element.querySelector(`option[value="${formData[element.name]}"]`)?.textContent?.trim() || '';
                        bootstrapSelectButton.querySelector('.filter-option').textContent = optionText;
                    }
                } else {
                    element.value = formData[element.name];
                }
            }
        });

        //alert('Données collées avec succès depuis le stockage local !');
    }
})();
