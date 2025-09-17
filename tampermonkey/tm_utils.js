// ==UserScript==
// @name         Tampermonkey Utils
// @namespace    https://github.com/Syfrost/JustWork-Next-Extension
// @version      1.0.0
// @description  Fonctions utilitaires partagées pour les scripts Tampermonkey
// @author       Cedric G
// @grant        GM_addStyle
// ==/UserScript==

// Ajouter les styles CSS pour les boutons
GM_addStyle(`
.button_Sy_DA {
    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0) !important;
    outline-color: rgba(255, 255, 255, .5) !important;
    outline-offset: 0px !important;
    outline: 1px solid rgba(255, 255, 255, 0) !important;
    text-shadow: none !important;
    transform: skewX(30deg);
    display: inline-block;
    font-size: 16px;
    text-align: left;
    float: right;
    width: calc(100% - 42px);
    padding: 12px 10px 12px 30px;
    text-align: center;
    font-size: 16px;
    text-transform: uppercase;
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.05);
    -webkit-mask-image: -webkit-gradient(linear, right top, left top, from(rgba(0, 0, 0, 0)), color-stop(70%, rgba(0, 0, 0, 1)), to(rgba(0, 0, 0, 1)));
    border-bottom: 2px solid rgba(255, 255, 255, .2);
    border-left: 2px solid rgba(255, 255, 255, .2);
    border-top: 2px solid rgba(255, 255, 255, .2);
    text-align: left;
}

.button_Sy_DA:hover {
    animation: fadingAnim 1250ms cubic-bezier(0.19, 1, 0.22, 1) infinite;
    background-color: rgba(0, 134, 27, 0.1);
    border-bottom: 2px solid rgba(84, 202, 70, 0.2);
    color: #51ce78;
}

@keyframes fadingAnim {
    0% {
        box-shadow: inset 0 0 20px rgba(255, 255, 255, .5), 0 0 20px rgba(255, 255, 255, .2);
        outline: 1px solid;
        outline-color: rgba(255, 255, 255, 1);
    }
    100% {
        outline-color: rgba(255, 255, 255, 0);
        outline-offset: 15px;
    }
}
`);

// Fonction globale pour styliser les boutons
window.styleButton = function(button, backgroundColor, iconClass) {
    button.className = 'button_Sy_DA';
    
    // Créer un ID unique pour ce bouton
    const buttonId = 'btn_' + Math.random().toString(36).substr(2, 9);
    button.id = buttonId;
    
    // Fonction pour convertir hex en rgba
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Fonction pour éclaircir une couleur
    function lightenColor(hex, percent) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
        const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
        const newB = Math.min(255, Math.floor(b + (255 - b) * percent));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    // Générer les variations de couleur
    const bgColor = hexToRgba(backgroundColor, 0.1);
    const borderColor = hexToRgba(backgroundColor, 0.2);
    const textColor = lightenColor(backgroundColor, 0.3);
    
    // Ajouter un style CSS spécifique pour ce bouton avec les couleurs personnalisées
    GM_addStyle(`
        #${buttonId}:hover {
            background-color: ${bgColor} !important;
            border-bottom: 2px solid ${borderColor} !important;
            color: ${textColor} !important;
        }
    `);
    
    button.innerHTML = `<i class='fa ${iconClass}'></i> ` + button.innerText;
};
