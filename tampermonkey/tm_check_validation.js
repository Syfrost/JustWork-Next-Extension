(function() {
    'use strict';

    if (!location.href.startsWith("https://planner.cloud.microsoft/webui/mytasks/assignedtome/view/board")) {
        return;
    }

    // Récupérer la valeur de l'élément #idUser ou chaîne vide si absent
    const cpPersoValue = (document.getElementById("idUser") || {}).value || "";

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

    // Bouton "Conforme"
    const buttonConfo = document.createElement('button');
    buttonConfo.innerText = 'Conforme';
    styleButton(buttonConfo, 'blue', 'fa-check');
    buttonConfo.onclick = function() {
        document.querySelectorAll('button[title="Conforme"]').forEach(button => button.click());
    };
    buttonContainer.appendChild(buttonConfo);

    // Bouton "Signer"
    const buttonSign = document.createElement('button');
    buttonSign.innerText = 'Signer';
    styleButton(buttonSign, 'orange', 'fa-pen');
    buttonSign.onclick = function() {
        console.log("cpPersoValue =", cpPersoValue);
        document.querySelectorAll(`button[cp="${cpPersoValue}"]`).forEach(button => button.click());
    };
    buttonContainer.appendChild(buttonSign);

    // Bouton "Valider"
    const buttonValidate = document.createElement('button');
    buttonValidate.innerText = 'Valider';
    styleButton(buttonValidate, 'green', 'fa-arrow-right');
    buttonValidate.onclick = function() {
        const btn = document.getElementById('fonctionnel_validateAndNext_form') || document.getElementById('fonctionnel_validate_form');
        if (btn) {
            btn.click();
        } else {
            alert('Bouton Valider introuvable!');
        }
    };
    buttonContainer.appendChild(buttonValidate);
})();
