// ==UserScript==
// @name         YouTube Background planner
// @namespace    https://tampermonkey.net/
// @version      1.6
// @description  YouTube en fond du planner
// @author       Cedric G
// @match        https://planner.cloud.microsoft/webui/*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/plannerstyle.user.js
// @downloadURL  https://raw.githubusercontent.com/Syfrost/JustWork-Next-Extension/master/tampermonkey/plannerstyle.user.js
// ==/UserScript==

(function () {
  'use strict';

  //const YOUTUBE_VIDEO_ID = "e8YXqReOSSg"; //star citi
  //const YOUTUBE_VIDEO_ID = "GosiJmZ0wsg"; //car drift
  const YOUTUBE_VIDEO_ID = "k12GHIJB92c"; //skiing

  function injectBackgroundWithBlur() {
    const container = document.querySelector(".appContent");
    if (!container) return;

    // Créer le wrapper vidéo + overlay
    const wrapper = document.createElement("div");
    wrapper.id = "youtube-bg-wrapper";
    wrapper.innerHTML = `
      <iframe
        id="youtube-bg"
        src="https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&modestbranding=1&rel=0"
        frameborder="0"
        allow="autoplay; fullscreen"
        allowfullscreen
      ></iframe>
      <div id="blur-overlay"></div>
    `;

    container.insertBefore(wrapper, container.firstChild);

    // Appliquer les styles
    GM_addStyle(`
      .taskEditor-dialog-container {
      background-color: rgba(41, 40, 39, 0.8) !important;
      backdrop-filter: blur(5px);
      }

      .quickaction-wrapper {
      background-color: rgba(1, 1, 1, 0.0) !important;
      backdrop-filter: blur(15px);
      }
      .quickaction-wrapper button {
      background-color: rgba(1, 1, 1, 0.7) !important;
      backdrop-filter: blur(15px);
      }

      ::-webkit-scrollbar-thumb {
      background-color: rgba(1, 1, 1, 0.3) !important;
      border-radius: 5px;
      }

      .grid-container {
      background-color: rgba(1, 1, 1, 0.2) !important;
      backdrop-filter: blur(15px);
      }

      div[class^="headerRowStyles-"] {
      background-color: rgba(1, 1, 1, 0.1) !important;
      border-color: transparent transparent rgba(1, 1, 1, 0.1);
      }

      .grid-row {
      background-color: rgba(1, 1, 1, 0.1) !important;
      border-color: transparent transparent rgba(1, 1, 1, 0.1);
      }

      .new-row-placeholder {
      background-color: rgba(1, 1, 1, 0.1) !important;
      }

      span[class^="wrapper-"] {
      display: none !important;
      }

      button.is-selected > span > div > .ms-Pivot-linkContent {
      background-color: rgba(1,1,1,0.4) !important;
      }

      .ms-Pivot-linkContent {
      border-radius: 5px !important;
      border-color: rgba(1,1,1,0.1) !important;
      }

      .textContent {
      border-radius: 5px
      }

      /*.textContent:hover {
      border: 1px solid rgb(219,113,40) !important;
      //margin: -2px -2px -2px -2px;
      }*/

      #unoSuiteNavContainer {
      border-bottom: 0px solid rgba(1,1,1,0) !important;
      }

      .o365cs-base,
      .o365sx-button,
      .o365sx-waffle,
      .o365sx-appName {
      background-color: rgba(5, 5, 5, 1) !important;
      }

      #O365_NavHeader {
      background-color: rgba(5, 5, 5, 1) !important;
      }

      .sideNav {
      background-color: rgba(1, 1, 1, 0.4) !important;
      backdrop-filter: blur(20px);
      border-right: 0px;
      box-shadow: 4px 0 10px rgba(0, 0, 0, 0.4);
      }

      .is-selected {
      background-color: rgba(1, 1, 1, 0.1) !important;
      backdrop-filter: blur(5px);
      }

      .taskcard {
      border-radius: 5px !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .taskcard:hover {
      transform: scale(1.15);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35) !important;
      border: 1px solid rgb(68,0,0) !important;
      z-index: 10;
      }

      /*ms-FocusZone:hover {
      transform: scale(1.15);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      z-index: 10;
      }*/

      .container {
      background-color: rgba(1, 1, 1, 0.4) !important;
      backdrop-filter: blur(20px);
      border-radius: 5px !important;

      }

      .placeholder {
      background-color: rgba(1, 1, 1, 0) !important;
      }

      #main-content-container {
        position: relative !important;
        background: none !important;
        z-index: 0;
      }

      #youtube-bg-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: -1;
      }

      #youtube-bg {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 120vw;
        height: 120vh;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: -2;
      }

      #blur-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(11px);
        z-index: -1;
      }

      html, body {
        background: none !important;
      }
    `);
  }

  // Fonction pour vérifier et injecter le background
  function checkAndInject() {
    const container = document.getElementById("main-content-container");
    if (container) {
      injectBackgroundWithBlur();
      return true;
    }
    return false;
  }

  // Vérification immédiate au cas où l'élément existe déjà
  if (!checkAndInject()) {
    // Si l'élément n'existe pas encore, utiliser MutationObserver
    const observer = new MutationObserver(() => {
      if (checkAndInject()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Timeout de sécurité pour éviter que l'observer reste actif indéfiniment
    setTimeout(() => {
      observer.disconnect();
      // Tentative finale après 10 secondes
      checkAndInject();
    }, 2000);
  }
})();
