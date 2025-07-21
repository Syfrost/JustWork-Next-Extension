(function () {
    'use strict';

    document.addEventListener("DOMContentLoaded", verifierPresenceTitre);

    const storageKey = "formCopies";

    // Initialiser les 5 stockages s'ils n'existent pas
    if (!localStorage.getItem(storageKey)) {
        resetStorage();
    }

    function resetStorage() {
        const vide = {
            "1": { data: null, label: "1" },
            "2": { data: null, label: "2" },
            "3": { data: null, label: "3" },
            "4": { data: null, label: "4" },
            "5": { data: null, label: "5" }
        };
        localStorage.setItem(storageKey, JSON.stringify(vide));
    }

    // Fonction pour supprimer toutes les copies (à exécuter dans la console)
    window.wipejw = function () {
        console.log("%cSuppression du stockage en cours...", "color: orange; font-weight: bold;");
        
        localStorage.removeItem(storageKey); // Supprime les anciennes copies
        // resetStorage(); // Réinitialise les valeurs
        
        console.log("%cStockage effacé avec succès !", "color: green; font-weight: bold;");
        location.reload(); // Rafraîchit la page pour afficher les boutons mis à jour
    };

    function verifierPresenceTitre() {
        return document.querySelector('.control-label')?.textContent.includes("Consistance Réparation");
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
        if (!buttonContainer || document.getElementById("btnCopier")) {
            return;
        }

        let separator = document.createElement("span");
        separator.id = "separatorTampermonkey";
        separator.innerHTML = "<i class='fa fa-arrows-alt-h' style='margin: 0 10px; font-size: 16px;'></i>";
        separator.style.alignSelf = "center";

        let btnCopier = document.createElement("button");
        btnCopier.id = "btnCopier";
        btnCopier.innerText = "Copier";
        btnCopier.onclick = copierFormulaire;
        styleButton(btnCopier, "#6c757d", "fa-copy");

        buttonContainer.prepend(separator);
        buttonContainer.prepend(btnCopier);

        let storedCopies = JSON.parse(localStorage.getItem(storageKey));
        Object.keys(storedCopies).forEach(key => {
            const slotData = storedCopies[key];
            let btnColler = document.createElement("button");
            btnColler.id = `btnColler-${key}`;
            btnColler.innerText = slotData.label || key;
            btnColler.onclick = () => collerFormulaire(key);
            styleButton(btnColler, "#6c757d", "fa-paste");
            buttonContainer.prepend(btnColler);
        });
    }

    function retirerBoutons() {
        document.getElementById("btnCopier")?.remove();
        document.getElementById("separatorTampermonkey")?.remove();
        Object.keys(JSON.parse(localStorage.getItem(storageKey))).forEach(key => {
            document.getElementById(`btnColler-${key}`)?.remove();
        });
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

    function copierFormulaire() {
        const formulaire = document.querySelector('#panel-body-general');
        if (!formulaire) {
            alert('Formulaire non trouvé sur cette page.');
            return;
        }

        const formData = {};
        formulaire.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.tagName === 'SELECT' && element.multiple) {
                formData[element.name] = Array.from(element.selectedOptions).map(option => option.value);
            } else {
                formData[element.name] = element.value;
            }
        });

        let storedCopies = JSON.parse(localStorage.getItem(storageKey));
        let choix = prompt("Choisissez où sauvegarder: " + Object.keys(storedCopies).join(", "));
        if (choix && storedCopies.hasOwnProperty(choix)) {
            let label = prompt("Entrez un nom pour ce preset :", storedCopies[choix]?.label || choix) || choix;
            storedCopies[choix] = {
                data: formData,
                label: label
            };
            localStorage.setItem(storageKey, JSON.stringify(storedCopies));
            alert(`Formulaire copié sous '${label}' !`);
            location.reload(); // pour mettre à jour les noms sur les boutons
        } else {
            alert('Choix invalide.');
        }
    }

    
    function collerFormulaire(slot) {
        const formulaire = document.querySelector('#panel-body-general');
        if (!formulaire) {
            alert('Formulaire non trouvé sur cette page.');
            return;
        }

        let storedCopies = JSON.parse(localStorage.getItem(storageKey));
        const formData = storedCopies[slot]?.data;
        if (!formData) {
            alert('Aucune donnée enregistrée pour ' + slot);
            return;
        }

        // Répéter plusieurs fois la saisie
        let repeatCount = 4; // nombre de fois que tu veux injecter les données
        let delay = 200; // en millisecondes

        let current = 0;

        const remplir = () => {
            formulaire.querySelectorAll('input, select, textarea').forEach((element) => {
                const value = formData[element.name];
                if (value !== undefined) {
                    if (element.tagName === 'SELECT' && element.multiple) {
                        Array.from(element.options).forEach(option => {
                            option.selected = value.includes(option.value);
                        });

                        const container = element.closest('.bootstrap-select');
                        if (container) {
                            const display = container.querySelector('.filter-option-inner-inner');
                            if (display) {
                                display.textContent = Array.from(element.selectedOptions).map(opt => opt.textContent).join(', ');
                            }
                        }

                    } else {
                        element.value = value;
                    }

                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.dispatchEvent(new Event('blur', { bubbles: true }));
                }
            });
        };

        const loop = () => {
            if (current < repeatCount) {
                remplir();
                current++;
                setTimeout(loop, delay);
            } else {
                console.log(`✅ Formulaire injecté ${repeatCount} fois pour stabilité.`);
            }
        };

        loop();
    }

})();
