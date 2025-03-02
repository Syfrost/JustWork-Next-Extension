# Chemins des fichiers
$sourcePath = "C:\Users\Syfrost\Documents\Project_perso\Fasst\out"
$manifestPath = "$sourcePath\manifest.json"

# Lire le manifest.json pour récupérer la version
$json = Get-Content $manifestPath | ConvertFrom-Json
$version = $json.version

# Définir le nom du fichier ZIP
$zipFile = "C:\Users\Syfrost\Documents\Project_perso\Fasst\JustWork-v$version.zip"

# Vérifier si un ancien fichier existe et le supprimer
if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

# Créer l'archive ZIP
Compress-Archive -Path "$sourcePath\*" -DestinationPath $zipFile

Write-Host "✅ Extension empaquetée en ZIP : JustWork-v$version.zip"
