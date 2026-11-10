# Chuyển ảnh trời (không trong suốt) thành JPEG thu nhỏ cho game: public/assets/bg/<pack>/sky.jpg
# Dùng .NET System.Drawing (có sẵn trên Windows, không cần thư viện ngoài).
#
#   powershell -File server/tools/bg-sky-jpg.ps1 -Src <ảnh gốc> -Pack <tên pack> [-Width 1440] [-Quality 92] [-Layer sky]
#
# Ví dụ (nền không gian Digital Moons, 4 biến thể):
#   ... -Src "assets_raw/bg/digitalmoons_space/src/Free Space Background By Digitalmoons/Space_Background1.png" -Pack space1
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [Parameter(Mandatory = $true)][string]$Pack,
  [int]$Width = 1440,
  [int]$Quality = 92,
  [string]$Layer = 'sky'     # tên lớp xuất ra (sky | far | mid | near)
)
Add-Type -AssemblyName System.Drawing
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$outDir = Join-Path $root "public\assets\bg\$Pack"
New-Item -ItemType Directory -Force $outDir | Out-Null
$img = [System.Drawing.Image]::FromFile((Resolve-Path $Src))
$h = [int][Math]::Round($img.Height * $Width / $img.Width)
$bmp = New-Object System.Drawing.Bitmap $Width, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $Width, $h)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$p = New-Object System.Drawing.Imaging.EncoderParameters 1
$p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
$out = Join-Path $outDir ($Layer + '.jpg')
$bmp.Save($out, $codec, $p)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
"{0}  {1}x{2}  {3} KB" -f $out, $Width, $h, [Math]::Round((Get-Item $out).Length / 1024)
