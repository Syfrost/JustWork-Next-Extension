(function () {
    'use strict';

    document.addEventListener("DOMContentLoaded", verifierPresenceTitre);

    const storageKey = "formCopies";
    const componentStorageKey = "componentFailures";

    // Tableau temporaire pour les requêtes EditComponentFailure
    let componentFailureRequests = [];

    // Initialiser le stockage s'il n'existe pas
    if (!localStorage.getItem(storageKey)) {
        resetStorage();
    }

    function resetStorage() {
        const vide = {};
        localStorage.setItem(storageKey, JSON.stringify(vide));
    }

    // Fonction pour récupérer le numéro de symbole depuis le panel-heading
    function getCurrentSymbole() {
        const panelTitle = document.querySelector('.panel-heading .panel-title .row');
        if (panelTitle) {
            const text = panelTitle.textContent.trim();
            // Extraire le numéro avant le tiret (exemple: "78660169 - TIROIR EQUIPE ALIM-104")
            const match = text.match(/^(\d+)\s*-/);
            if (match) {
                return match[1];
            }
        }
        return null;
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

        // Vérifier la présence de l'élément "Saisie REX"
        checkSaisieRexPresence();
    }, 1000);

    // Vérification simple de la présence de l'élément "Saisie REX"
    function checkSaisieRexPresence() {
        const saisieRexTitle = document.querySelector('h3.panel-title');
        const isSaisieRexPresent = saisieRexTitle && saisieRexTitle.textContent.trim() === "Saisie REX";

        // Gérer les changements d'état
        if (isSaisieRexPresent && !window.isSaisieRexPageActive) {
            // L'élément vient d'apparaître - activer l'interception
            console.log("🔍 Détection de l'élément 'Saisie REX' - Activation de l'interception des requêtes");
            if (!window.fetchIntercepted) {
                interceptComponentFailureRequests();
            }
            window.isSaisieRexPageActive = true;

        } else if (!isSaisieRexPresent && window.isSaisieRexPageActive) {
            // L'élément vient de disparaître - désactiver l'interception
            console.log("❌ Élément 'Saisie REX' non détecté - Désactivation de l'interception");
            window.isSaisieRexPageActive = false;

        }

        // Afficher le statut si changement
        if (window.isSaisieRexPageActive !== window.previousRexState) {
            console.log(`📊 Statut interception: ${window.isSaisieRexPageActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
            window.previousRexState = window.isSaisieRexPageActive;
        }
    }

    // Intercepter les requêtes POST vers EditComponentFailure - INTERCEPTION PERMANENTE
    function interceptComponentFailureRequests() {
        console.log("🎯 appel de intercept failure");
        // Éviter la double interception
        if (window.fetchIntercepted) return;

        console.log("🎯 Installation de l'interception XMLHttpRequest des requêtes EditComponentFailure");

        // === INTERCEPTION XMLHttpRequest ===
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            console.log("🚀 XHR OPEN intercepté:", method, url);
            this._method = method;
            this._url = url;
            return originalXHROpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(data) {
            if (this._method === 'POST') {
                console.log("🔍 DEBUG XHR - Requête POST détectée vers:", this._url);

                const isEditComponentFailure = this._url && (
                    this._url.includes('EditComponentFailure') ||
                    this._url.includes('/Prm/ReparationForms/Saisie_Intervention/EditComponentFailure')
                );

                if (window.isSaisieRexPageActive && isEditComponentFailure) {
                    console.log("📡 XHR - Interception d'une requête EditComponentFailure (flag ACTIF)");
                    console.log("📦 Data XHR:", data);
                    console.log("🔍 Type de data:", typeof data);

                    let formData = {};

                    // Traiter les données FormData
                    if (data instanceof FormData) {
                        console.log("📋 Traitement FormData");
                        for (let [key, value] of data.entries()) {
                            formData[key] = value;
                        }
                    }
                    // Traiter les données URL-encodées (string)
                    else if (typeof data === 'string' && data.includes('=')) {
                        console.log("📋 Traitement données URL-encodées");
                        const pairs = data.split('&');
                        for (let pair of pairs) {
                            const [key, value] = pair.split('=');
                            if (key && value) {
                                formData[decodeURIComponent(key)] = decodeURIComponent(value);
                            }
                        }
                    }

                    console.log("🗂️ FormData parsée:", formData);

                    // Extraire seulement les champs requis si ils existent
                    const filteredData = {
                        fk_dico_constituant: formData.fk_dico_constituant,
                        fk_dico_defaut_constituant: formData.fk_dico_defaut_constituant,
                        S_repere: formData.S_repere,
                        idt_t_reparation_has_lst_dico_constituant: formData.idt_t_reparation_has_lst_dico_constituant
                    };

                    // Vérifier qu'on a au moins un champ requis
                    if (filteredData.fk_dico_constituant || filteredData.fk_dico_defaut_constituant || filteredData.S_repere) {
                        componentFailureRequests.push(filteredData);
                        console.log("💾 Requête XHR enregistrée:", filteredData);
                        console.log("📊 Total des requêtes enregistrées:", componentFailureRequests.length);
                    } else {
                        console.log("⚠️ Aucun champ requis trouvé dans les données");
                    }
                }
            }

            return originalXHRSend.apply(this, arguments);
        };

        window.fetchIntercepted = true;
        console.log("✅ Interception XHR installée - En attente du flag d'activation");
    }

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
        const spanCopier = document.createElement("span");
        spanCopier.innerText = "Copier";
        btnCopier.appendChild(spanCopier);
        btnCopier.onclick = copierFormulaire;
        window.styleButton(btnCopier, "#6c757d", "fa-copy");

        buttonContainer.prepend(separator);
        buttonContainer.prepend(btnCopier);

        let storedCopies = JSON.parse(localStorage.getItem(storageKey));
        Object.keys(storedCopies).forEach(key => {
            const slotData = storedCopies[key];
            // Vérifier si le bouton existe déjà
            if (document.getElementById(`btnColler-${key}`)) return;

            // Vérifier si l'élément est lié à un symbole
            const currentSymbole = getCurrentSymbole();
            const isSymbolLinked = slotData.linkedSymbole;

            // Si l'élément est lié à un symbole, vérifier la correspondance
            if (isSymbolLinked && isSymbolLinked !== currentSymbole) {
                console.log(`Bouton ${key} masqué - Symbole requis: ${isSymbolLinked}, Symbole actuel: ${currentSymbole}`);
                return; // Ne pas afficher le bouton si le symbole ne correspond pas
            }

            let btnColler = document.createElement("button");
            btnColler.id = `btnColler-${key}`;
            btnColler.style.position = "relative"; // Pour positionner la croix
            const spanColler = document.createElement("span");
            spanColler.innerText = slotData.label || key;
            btnColler.appendChild(spanColler);
            btnColler.onclick = () => collerFormulaire(key);

            // Coloration différente si lié à un symbole
            const buttonColor = isSymbolLinked ? "#6f42c1" : "#6c757d"; // Mauve si lié à un symbole, gris sinon
            window.styleButton(btnColler, buttonColor, "fa-paste");

            // Ajouter la gestion du hover pour la suppression
            addDeleteFunctionality(btnColler, key);

            buttonContainer.prepend(btnColler);
        });
    }

    function retirerBoutons() {
        document.getElementById("btnCopier")?.remove();
        document.getElementById("separatorTampermonkey")?.remove();
        const storedCopies = JSON.parse(localStorage.getItem(storageKey));
        Object.keys(storedCopies).forEach(key => {
            document.getElementById(`btnColler-${key}`)?.remove();
        });
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

        // Créer une boîte de dialogue personnalisée pour la copie
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ccc;
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            min-width: 400px;
        `;

        const currentSymbole = getCurrentSymbole();

        dialog.innerHTML = `
            <h3 style="margin-top: 0;">Copier le formulaire</h3>
            <div style="margin-bottom: 15px;">
                <label for="presetName">Nom du preset :</label><br>
                <input type="text" id="presetName" style="width: 100%; padding: 5px; margin-top: 5px;" placeholder="Entrez un nom...">
            </div>
            <div style="margin-bottom: 15px;">
                <label>
                    <input type="checkbox" id="linkToSymbol" style="margin-right: 8px;">
                    Lier au symbole actuel (${currentSymbole || 'Non détecté'})
                </label>
            </div>
            <div style="text-align: right;">
                <button id="cancelCopy" style="margin-right: 10px; padding: 8px 16px;">Annuler</button>
                <button id="confirmCopy" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">Copier</button>
            </div>
        `;

        document.body.appendChild(dialog);

        // Gérer les événements
        document.getElementById('cancelCopy').onclick = () => {
            document.body.removeChild(dialog);
        };

        document.getElementById('confirmCopy').onclick = () => {
            const presetName = document.getElementById('presetName').value.trim();
            const linkToSymbol = document.getElementById('linkToSymbol').checked;

            if (!presetName) {
                alert('Veuillez entrer un nom pour le preset.');
                return;
            }

            const storedCopies = JSON.parse(localStorage.getItem(storageKey));
            const uniqueKey = Date.now().toString(); // Utiliser timestamp comme clé unique

            const copyData = {
                data: formData,
                label: presetName,
                componentFailures: [...componentFailureRequests],
                linkedSymbole: linkToSymbol ? currentSymbole : null,
                createdAt: new Date().toISOString()
            };

            storedCopies[uniqueKey] = copyData;
            localStorage.setItem(storageKey, JSON.stringify(storedCopies));

            console.log(`💾 Formulaire copié sous '${presetName}' avec ${componentFailureRequests.length} requêtes de composants`);
            console.log(`🔗 Lié au symbole: ${linkToSymbol ? currentSymbole : 'Non'}`);

            alert(`Formulaire copié sous '${presetName}' !\nRequêtes de composants enregistrées: ${componentFailureRequests.length}\nLié au symbole: ${linkToSymbol ? currentSymbole : 'Non'}`);

            document.body.removeChild(dialog);
            location.reload(); // pour mettre à jour les boutons
        };

        // Focus sur le champ de nom
        document.getElementById('presetName').focus();
    }

    // Fonction pour ajouter la fonctionnalité de suppression avec hover
    function addDeleteFunctionality(button, key) {
        let hoverTimeout;
        let deleteButton;

        button.addEventListener('mouseenter', () => {
            // Démarrer le timer de 3 secondes
            hoverTimeout = setTimeout(() => {
                // Créer la croix de suppression
                deleteButton = document.createElement('div');
                deleteButton.innerHTML = '<i class="fa fa-times"></i>';
                deleteButton.style.cssText = `
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 18px;
                    height: 18px;
                    background: #dc3545;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 1001;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    transition: all 0.2s ease;
                    transform: skew(10deg);
                `;

                deleteButton.addEventListener('mouseenter', () => {
                    deleteButton.style.transform = 'skew(10deg) scale(1.2)';
                    deleteButton.style.background = '#c82333';
                });

                deleteButton.addEventListener('mouseleave', () => {
                    deleteButton.style.transform = 'skew(10deg) scale(1)';
                    deleteButton.style.background = '#dc3545';
                });

                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Empêcher le clic sur le bouton principal
                    deletePreset(key);
                });

                button.appendChild(deleteButton);
            }, 2000); // 2 secondes (modifiez cette valeur pour changer le délai)
        });

        button.addEventListener('mouseleave', () => {
            // Annuler le timer si on quitte avant 3 secondes
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }

            // Supprimer la croix si elle existe
            if (deleteButton && button.contains(deleteButton)) {
                button.removeChild(deleteButton);
                deleteButton = null;
            }
        });
    }

    // Fonction pour supprimer un preset
    function deletePreset(key) {
        const storedCopies = JSON.parse(localStorage.getItem(storageKey));
        const presetName = storedCopies[key]?.label || key;

        if (confirm(`Êtes-vous sûr de vouloir supprimer le preset "${presetName}" ?`)) {
            delete storedCopies[key];
            localStorage.setItem(storageKey, JSON.stringify(storedCopies));

            console.log(`🗑️ Preset "${presetName}" supprimé`);

            // Retirer le bouton du DOM
            const buttonToRemove = document.getElementById(`btnColler-${key}`);
            if (buttonToRemove) {
                buttonToRemove.remove();
            }

            alert(`Preset "${presetName}" supprimé avec succès !`);
        }
    }


    // Fonction pour valider le textarea via l'API
    async function validateTextarea(textValue) {
        try {
            // Récupérer les valeurs nécessaires du DOM
            const idUserElement = document.getElementById('idUser');
            const idRepElement = document.getElementById('idRep');

            if (!idUserElement || !idRepElement) {
                console.error('Éléments idUser ou idRep non trouvés');
                return false;
            }

            const payload = new FormData();
            payload.append('S_observation_reparation', textValue);
            payload.append('field', 'S_observation_reparation');
            payload.append('fonctionnel_transition_id', '277');
            payload.append('form_id', 'Saisie_Intervention');
            payload.append('save_on_validate', 'true');
            payload.append('idUser', idUserElement.value);
            payload.append('current_repair_id', idRepElement.value);

            const response = await fetch('https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/Validate', {
                method: 'POST',
                body: payload,
                credentials: 'include' // Pour inclure les cookies de session
            });

            if (response.ok) {
                console.log('✅ Validation réussie pour le textarea');
                return true;
            } else {
                console.error('❌ Erreur lors de la validation:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la requête de validation:', error);
            return false;
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

                // Validation du textarea après remplissage
                const textareaElement = document.getElementById('S_observation_reparation');
                if (textareaElement && textareaElement.value) {
                    console.log('🔄 Validation du textarea en cours...');
                    validateTextarea(textareaElement.value);
                }
            }
        };

        loop();

        // Rejouer les requêtes de composants après le remplissage
        const componentFailures = storedCopies[slot]?.componentFailures;
        if (componentFailures && componentFailures.length > 0) {
            console.log(`🔄 Rejeu de ${componentFailures.length} requêtes de composants...`);
            setTimeout(() => {
                replayComponentFailureRequests(componentFailures);
            }, 1000); // Attendre 1 seconde après le remplissage du formulaire
        }
    }

    // Rejouer les requêtes EditComponentFailure
    async function replayComponentFailureRequests(componentFailures) {
        const idRepElement = document.getElementById('idRep');
        const idUserElement = document.getElementById('idUser');

        if (!idRepElement || !idUserElement) {
            console.error('❌ Éléments idRep ou idUser non trouvés');
            return;
        }

        const idRep = idRepElement.value;
        const idUser = idUserElement.value;

        for (let i = 0; i < componentFailures.length; i++) {
            const componentData = componentFailures[i];

            try {
                const formData = new FormData();
                formData.append('fk_dico_constituant', componentData.fk_dico_constituant);
                formData.append('fk_dico_defaut_constituant', componentData.fk_dico_defaut_constituant);
                formData.append('S_repere', componentData.S_repere);
                formData.append('idt_t_reparation_has_lst_dico_constituant', componentData.idt_t_reparation_has_lst_dico_constituant);
                formData.append('t_reparation_idt_reparation', idRep);
                formData.append('idUser', idUser);
                formData.append('current_repair_id', idRep);

                console.log(`📤 Envoi de la requête ${i + 1}/${componentFailures.length}:`, componentData);

                const response = await fetch('https://prod.cloud-collectorplus.mt.sncf.fr/Prm/ReparationForms/Saisie_Intervention/EditComponentFailure', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (response.ok) {
                    console.log(`✅ Requête ${i + 1} envoyée avec succès`);

                    // Récupérer et traiter la réponse JSON
                    try {
                        const responseData = await response.json();
                        console.log(`📨 Réponse ${i + 1}:`, responseData);

                        // Vérifier si la réponse contient du HTML pour les composants
                        if (responseData.status === "OK" && responseData.component_panel) {
                            console.log(`🔄 Mise à jour du DOM avec le HTML de la réponse ${i + 1}`);
                            updateComponentsTable(responseData.component_panel);
                        } else {
                            console.log(`⚠️ Réponse ${i + 1} sans HTML de composants`);
                        }
                    } catch (jsonError) {
                        console.error(`❌ Erreur parsing JSON réponse ${i + 1}:`, jsonError);
                    }
                } else {
                    console.error(`❌ Erreur requête ${i + 1}:`, response.status, response.statusText);
                }

                // Délai entre les requêtes pour éviter la surcharge
                if (i < componentFailures.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

            } catch (error) {
                console.error(`❌ Erreur lors de l'envoi de la requête ${i + 1}:`, error);
            }
        }

        console.log('🎉 Toutes les requêtes de composants ont été rejouées');
    }

    // Fonction pour mettre à jour le tableau des composants avec le HTML reçu
    function updateComponentsTable(htmlContent) {
        try {
            console.log("🎯 Début de mise à jour du tableau des composants - mise à jour du tbody uniquement");

            // Trouver le tableau dans .dataTables_scrollBody
            const scrollBodyTable = document.querySelector('.dataTables_scrollBody #components_panel_table');

            if (scrollBodyTable) {
                console.log("📋 Tableau dans dataTables_scrollBody trouvé");

                // Parser le nouveau HTML pour extraire le tbody
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                const newTable = tempDiv.querySelector('#components_panel_table');

                if (newTable) {
                    const newTbody = newTable.querySelector('tbody');
                    const existingTbody = scrollBodyTable.querySelector('tbody');

                    if (newTbody && existingTbody) {
                        console.log("🔄 Remplacement du tbody existant avec le nouveau contenu");

                        // Copier les nouvelles lignes avec leurs attributs DataTables
                        const newRows = Array.from(newTbody.querySelectorAll('tr'));

                        // Vider le tbody existant
                        existingTbody.innerHTML = '';

                        // Ajouter les nouvelles lignes avec les classes DataTables appropriées
                        newRows.forEach((row, index) => {
                            // Ajouter les classes DataTables pour le tri et les styles
                            row.setAttribute('role', 'row');
                            row.classList.add(index % 2 === 0 ? 'odd' : 'even');

                            // Ajouter les classes sorting aux cellules si nécessaire
                            const cells = row.querySelectorAll('td');
                            cells.forEach(cell => {
                                if (cell.classList.contains('component_default')) {
                                    cell.classList.add('sorting_1');
                                }
                            });

                            existingTbody.appendChild(row);
                        });

                        console.log(`✅ ${newRows.length} lignes mises à jour dans le tbody`);

                        // Déclencher des événements DataTables pour réinitialiser le tri/pagination
                        if (window.$ && $.fn.DataTable) {
                            const dataTable = $('#components_panel_table').DataTable();
                            if (dataTable) {
                                console.log("🔄 Réinitialisation DataTables");
                                dataTable.draw(false);
                            }
                        }

                        // Déclencher un événement personnalisé
                        scrollBodyTable.dispatchEvent(new Event('contentUpdated', { bubbles: true }));

                        // Cliquer automatiquement sur le bouton avec btn-primary après l'hydratation
                        setTimeout(() => {
                            clickConsistanceButton();
                        }, 900); // Délai pour laisser le DOM se stabiliser

                    } else {
                        console.log("⚠️ Tbody non trouvé, remplacement complet du tableau");
                        scrollBodyTable.replaceWith(newTable);

                        // Cliquer sur le bouton même en cas de remplacement complet
                        setTimeout(() => {
                            clickConsistanceButton();
                        }, 900);
                    }
                } else {
                    console.log("❌ Aucun tableau trouvé dans la réponse HTML");
                }

            } else {
                console.log("⚠️ Tableau dataTables_scrollBody non trouvé, fallback vers conteneur global");

                // Fallback vers l'ancien comportement
                const existingContainer = document.getElementById('components_table_container');
                if (existingContainer) {
                    console.log("📋 Utilisation du conteneur components_table_container comme fallback");
                    existingContainer.innerHTML = htmlContent;
                    console.log("✅ HTML inséré dans le conteneur fallback");
                } else {
                    console.log("❌ Aucun conteneur approprié trouvé pour insérer le HTML");
                }
            }

        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour du DOM:", error);
        }
    }

    // Fonction pour cliquer sur le bouton de consistance avec la classe btn-primary
    function clickConsistanceButton() {
        try {
            console.log("🎯 Recherche du bouton de consistance avec btn-primary");

            // Trouver le conteneur des boutons de consistance
            const btnGroup = document.querySelector('.btn-group.pull-right[aria-label="Consistance Réparation"]');

            if (btnGroup) {
                console.log("📋 Conteneur de boutons de consistance trouvé");

                // Chercher le bouton avec la classe btn-primary dans ce groupe
                const primaryButton = btnGroup.querySelector('button.btn-primary');

                if (primaryButton) {
                    console.log("🔘 Bouton btn-primary trouvé:", primaryButton.textContent.trim());
                    console.log("📍 ID du bouton:", primaryButton.id);
                    console.log("🎯 Valeur collector:", primaryButton.getAttribute('collector-value'));

                    // Simuler un clic sur le bouton
                    primaryButton.click();

                    // Déclencher aussi les événements manuellement au cas où
                    primaryButton.dispatchEvent(new Event('click', { bubbles: true }));
                    primaryButton.dispatchEvent(new Event('change', { bubbles: true }));

                    console.log("✅ Clic automatique effectué sur le bouton de consistance");

                } else {
                    console.log("⚠️ Aucun bouton btn-primary trouvé dans le groupe de consistance");

                    // Lister tous les boutons disponibles pour debug
                    const allButtons = btnGroup.querySelectorAll('button');
                    console.log("🔍 Boutons disponibles:");
                    allButtons.forEach((btn, index) => {
                        console.log(`  ${index + 1}. ${btn.textContent.trim()} - Classes: ${btn.className}`);
                    });
                }

            } else {
                console.log("❌ Conteneur de boutons de consistance non trouvé");

                // Recherche alternative plus large
                const alternativeButton = document.querySelector('button.btn-primary[collector-value]');
                if (alternativeButton) {
                    console.log("🔄 Bouton btn-primary alternatif trouvé, clic effectué");
                    alternativeButton.click();
                } else {
                    console.log("❌ Aucun bouton btn-primary avec collector-value trouvé sur la page");
                }
            }

        } catch (error) {
            console.error("❌ Erreur lors du clic automatique sur le bouton de consistance:", error);
        }
    }

})();
