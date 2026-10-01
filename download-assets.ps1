$ErrorActionPreference = 'Stop'
$assetPath = Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Path $assetPath -Force | Out-Null
function Save-Asset($Uri, $Name) {
    try {
        Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile (Join-Path $assetPath $Name) -TimeoutSec 20
        Write-Output "Saved $Name"
    } catch { Write-Output "Unavailable ${Name}: $($_.Exception.Message)" }
}
Save-Asset 'https://sks-lombard.ru/upload/settings/logoImage04-2022_081041.svg' 'sks-logo.svg'
foreach ($weight in @('Regular', 'Medium', 'SemiBold', 'Bold')) {
    Save-Asset "https://sks-lombard.ru/local/templates/sks-lombard/assets/fonts/IBMPlexSans-$weight.woff2" "plex-$weight.woff2"
}
try {
    $jewelry = Invoke-RestMethod -Uri 'https://fakestoreapi.com/products/category/jewelery' -TimeoutSec 20
    Save-Asset ($jewelry | Where-Object { $_.id -eq 7 }).image 'ring.png'
    Save-Asset ($jewelry | Where-Object { $_.id -eq 6 }).image 'necklace.png'
    Save-Asset ($jewelry | Where-Object { $_.id -eq 8 }).image 'earrings.png'
} catch { Write-Output "Jewelry source unavailable: $($_.Exception.Message)" }
foreach ($category in @('smartphones', 'laptops', 'mens-watches', 'mobile-accessories')) {
    try {
        $items = (Invoke-RestMethod -Uri "https://dummyjson.com/products/category/$category" -TimeoutSec 20).products
        if ($category -eq 'smartphones') { Save-Asset ($items | Where-Object { $_.title -match 'iPhone 13' } | Select-Object -First 1).thumbnail 'phone.png' }
        if ($category -eq 'laptops') { Save-Asset $items[0].thumbnail 'laptop.png' }
        if ($category -eq 'mens-watches') { Save-Asset $items[0].thumbnail 'watch.png' }
        if ($category -eq 'mobile-accessories') { Save-Asset ($items | Where-Object { $_.title -match 'Headphone' } | Select-Object -First 1).thumbnail 'audio.png' }
    } catch { Write-Output "Source unavailable ${category}: $($_.Exception.Message)" }
}
