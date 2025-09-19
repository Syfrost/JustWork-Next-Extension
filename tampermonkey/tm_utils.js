// ==UserScript==
// @name         Tampermonkey Utils
// @version      1.0.2
// @description  Fonctions utilitaires
// @author       Cedric G
// ==/UserScript==

GM_addStyle(`
    .button_Sy_DA {
        --color-primary: #644dff;
        --color-dark: #4836bb;
        --color-shadow: #654dff63;
        cursor: pointer;
        width: auto;
        min-width: 120px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #fff;
        background: var(--color-primary);
        border: 2px solid var(--color-dark);
        border-radius: 0.75rem;
        box-shadow: 0 6px 0 var(--color-dark);
        transform: skew(-10deg);
        transition: all 0.1s ease;
        filter: drop-shadow(0 10px 15px var(--color-shadow));
        padding: 6px 16px;
        margin: 5px;
    }

    .button_Sy_DA:hover {
        transform: skew(-10deg) translateY(2px);
        box-shadow: 0 4px 0 var(--color-dark);
        filter: drop-shadow(0 8px 12px var(--color-shadow));
    }

    .button_Sy_DA:active {
        letter-spacing: 0px;
        transform: skew(-10deg) translateY(6px);
        box-shadow: 0 0 0 var(--color-dark);
        filter: drop-shadow(0 2px 5px var(--color-shadow));
    }

    .button_Sy_DA span {
        //transform: skew(10deg) !important;
        display: inline-block;
    }

    .button_Sy_DA svg {
        //transform: skew(10deg) !important;
        display: inline-block;
    }

    .button_Sy_DA i {
        //transform: skew(10deg);
        display: inline-block;
    }

    .collectorpanel {
        display: flex;
        flex-direction: row;
        overflow: visible !important;
        //transform: skew(10deg);
        background-color: rgba(20, 22, 22, 0) !important;
        box-shadow: 0 0 10px hsla(0, 0%, 0%, 0.00) !important;
        border-radius: 0px !important;
        margin-right: 10px !important;
        padding: 10px;
    }

    /* Forcer l'overflow sur le conteneur parent si nécessaire */
    .collectorpanel, .collectorpanel * {
        overflow: visible !important;
    }
    }
        `);

// Fonction globale pour styliser les boutons
window.styleButton = function(button, backgroundColor, iconClass) {
    button.className = 'button_Sy_DA';

    // Fonction pour convertir les noms de couleurs en hexadécimal
    function colorNameToHex(color) {
        const colors = {
            'red': '#FF0000',
            'green': '#008000',
            'blue': '#0000FF',
            'orange': '#FFA500',
            'yellow': '#FFFF00',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'brown': '#A52A2A',
            'black': '#000000',
            'white': '#FFFFFF',
            'gray': '#808080',
            'grey': '#808080',
            'cyan': '#00FFFF',
            'magenta': '#FF00FF',
            'lime': '#00FF00',
            'navy': '#000080',
            'teal': '#008080',
            'silver': '#C0C0C0',
            'maroon': '#800000',
            'olive': '#808000'
        };

        // Si c'est déjà un code hex, le retourner tel quel
        if (color.startsWith('#')) {
            return color;
        }

        // Sinon, chercher dans le dictionnaire des couleurs
        return colors[color.toLowerCase()] || '#808080'; // Gris par défaut si couleur inconnue
    }

    // Convertir la couleur en hexadécimal si nécessaire
    const hexColor = colorNameToHex(backgroundColor);

    // Fonction pour convertir hex en rgba
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Fonction pour assombrir une couleur
    function darkenColor(hex, percent) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const newR = Math.max(0, Math.floor(r * (1 - percent)));
        const newG = Math.max(0, Math.floor(g * (1 - percent)));
        const newB = Math.max(0, Math.floor(b * (1 - percent)));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    // Générer les variations de couleur avec la couleur convertie
    const primaryColor = hexColor;
    const darkColor = darkenColor(hexColor, 0.2); // 20% plus sombre
    const shadowColor = hexToRgba(hexColor, 0.4); // 40% d'opacité pour l'ombre

    // Ajouter un style CSS spécifique pour ce bouton avec les couleurs personnalisées
    if (button.id) {
        GM_addStyle(`
            #${button.id} {
                --color-primary: ${primaryColor} !important;
                --color-dark: ${darkColor} !important;
                --color-shadow: ${shadowColor} !important;
                background: ${primaryColor} !important;
                border-color: ${darkColor} !important;
                box-shadow: 0 6px 0 ${darkColor} !important;
                filter: drop-shadow(0 10px 15px ${shadowColor}) !important;
            }

            #${button.id}:hover {
                background: ${primaryColor} !important;
                border-color: ${darkColor} !important;
                box-shadow: 0 4px 0 ${darkColor} !important;
                filter: drop-shadow(0 8px 12px ${shadowColor}) !important;
            }

            #${button.id}:active {
                background: ${primaryColor} !important;
                border-color: ${darkColor} !important;
                box-shadow: 0 0 0 ${darkColor} !important;
                filter: drop-shadow(0 2px 5px ${shadowColor}) !important;
            }
        `);
    }

    // Trouver le span à l'intérieur du bouton et ajouter l'icône
    const span = button.querySelector('span');
    if (span) {
        // Créer l'icône séparément
        const icon = document.createElement('i');
        icon.className = `fa ${iconClass}`;

        // Insérer l'icône AVANT le span
        button.insertBefore(icon, span);
        button.insertBefore(document.createTextNode(' '), span); // Espace entre icône et texte
    } else {
        // Fallback si pas de span trouvé
        button.innerHTML = `<i class='fa ${iconClass}'></i> ` + button.innerText;
    }
};
