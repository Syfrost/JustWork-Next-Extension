(function() {
    'use strict';

    // Récupérer la valeur `cpValue` définie par l'utilisateur
    const cpValue = window.cpValue || "N"; // Valeur par défaut si non définie

    // Créer un conteneur pour les boutons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '10px';
    buttonContainer.style.right = '10px';
    buttonContainer.style.zIndex = '1000';
    buttonContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    buttonContainer.style.padding = '10px';
    buttonContainer.style.borderRadius = '5px';
    buttonContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    document.body.appendChild(buttonContainer);

    // Fonction pour styliser les boutons
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

    // Créer le bouton "Conforme"
    const buttonConfo = document.createElement('button');
    buttonConfo.innerText = 'Conforme';
    styleButton(buttonConfo, 'blue', 'fa-check');
    buttonConfo.onclick = function() {
        const buttons_CONFO = document.querySelectorAll('button[title="Conforme"]');
        buttons_CONFO.forEach(button => button.click());
    };
    buttonContainer.appendChild(buttonConfo);

    // Créer le bouton "Signer"
    const buttonSign = document.createElement('button');
    buttonSign.innerText = 'Signer';
    styleButton(buttonSign, 'orange', 'fa-pen');
    buttonSign.onclick = function() {
        const buttons_SIGN = document.querySelectorAll(`button[cp="${cpValue}"]`);
console.log("cp" + cpValue);
        buttons_SIGN.forEach(button => button.click());
    };
    buttonContainer.appendChild(buttonSign);

    // Créer le bouton "Valider"
    const buttonValidate = document.createElement('button');
    buttonValidate.innerText = 'Valider';
    styleButton(buttonValidate, 'green', 'fa-arrow-right');

    buttonValidate.onclick = function() {
        const validateAndNextButton = document.getElementById('fonctionnel_validateAndNext_form');

        if (validateAndNextButton) {
            validateAndNextButton.click();
        } else {
            const validateButton = document.getElementById('fonctionnel_validate_form');
            if (validateButton) {
                validateButton.click();
            } else {
                alert('Bouton Valider introuvable!');
            }
        }
    };

    // Ajouter le bouton au conteneur existant
    buttonContainer.appendChild(buttonValidate);

})();
