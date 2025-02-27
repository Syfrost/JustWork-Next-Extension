const fs = require("fs");
const path = require("path");

const manifestPath = "C:/Users/Syfrost/Documents/Project_perso/Fasst/out/manifest.json";
const oldCrx = "C:/Users/Syfrost/Documents/Project_perso/Fasst/out.crx";

// Vérifier que le manifest.json existe
if (!fs.existsSync(manifestPath)) {
    console.error("❌ Erreur : manifest.json introuvable !");
    process.exit(1);
}

// Lire et récupérer la version
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;

// Définir le nouveau nom du .crx
const newCrx = `C:/Users/Syfrost/Documents/Project_perso/Fasst/JustWork-v${version}.crx`;

// Vérifier si le fichier .crx existe et le renommer
if (fs.existsSync(oldCrx)) {
    fs.renameSync(oldCrx, newCrx);
    console.log(`✅ Extension renommée : JustWork-v${version}.crx`);
} else {
    console.error("❌ Erreur : Le fichier out.crx n'a pas été trouvé !");
}
