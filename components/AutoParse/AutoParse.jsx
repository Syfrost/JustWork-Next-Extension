// ButtonAuto.js
import React from 'react';

export default function ButtonAuto() {
    const handleClick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Injecter d'abord inject.js
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['inject.js'] // Assurez-vous que ce chemin est correct
            }, () => {
                // Une fois inject.js chargé, envoyer un message pour déclencher l'action
                chrome.tabs.sendMessage(tabs[0].id, { action: 'cliquer_bouton' });
            });
        });
    };

    return (
        <button onClick={handleClick}>Cliquez pour action automatique</button>
    );
}