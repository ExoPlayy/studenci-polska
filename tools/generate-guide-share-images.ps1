Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'assets\share\guides'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$items = @(
  @('jak-wybrac-miasto-i-uczelnie','Jak wybrać miasto i uczelnię?','warszawa'),
  @('bezpieczny-wynajem-mieszkania','Bezpieczny wynajem mieszkania','krakow'),
  @('akademik-czy-mieszkanie','Akademik czy mieszkanie?','wroclaw'),
  @('budzet-studenta','Budżet studenta','poznan'),
  @('stypendia-i-pomoc-materialna','Stypendia i pomoc materialna','lublin'),
  @('pierwsze-tygodnie-na-studiach','Pierwsze tygodnie na studiach','trojmiasto'),
  @('jak-poznac-ludzi-na-studiach','Jak poznać ludzi na studiach?','lodz'),
  @('jak-przygotowac-sie-do-sesji','Jak przygotować się do sesji?','torun'),
  @('praca-podczas-studiow','Praca podczas studiów','katowice'),
  @('przeprowadzka-na-studia','Przeprowadzka na studia','rzeszow'),
  @('bezpieczenstwo-studenta','Bezpieczeństwo studenta','szczecin'),
  @('zdrowie-i-rownowaga-na-studiach','Zdrowie i równowaga','olsztyn'),
  @('rekrutacja-na-studia-krok-po-kroku','Rekrutacja krok po kroku','bialystok'),
  @('jak-wybrac-kierunek-studiow','Jak wybrać kierunek studiów?','bydgoszcz'),
  @('legitymacja-studencka-i-znizki','Legitymacja i zniżki','kielce'),
  @('organizacja-nauki-na-studiach','Organizacja nauki','opole'),
  @('kola-naukowe-i-portfolio','Koła naukowe i portfolio','zielona-gora'),
  @('erasmus-i-wyjazdy-studenckie','Erasmus i wyjazdy studenckie','czestochowa')
)

function Save-Card($source,$target,$title,$number){
  $src=[System.Drawing.Image]::FromFile($source)
  $bmp=New-Object System.Drawing.Bitmap 1200,630
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode='HighQuality'; $g.InterpolationMode='HighQualityBicubic'; $g.TextRenderingHint='AntiAliasGridFit'
  $scale=[Math]::Max(1200/$src.Width,630/$src.Height)
  $w=[int]($src.Width*$scale); $h=[int]($src.Height*$scale)
  $g.DrawImage($src,[int]((1200-$w)/2),[int]((630-$h)/2),$w,$h)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(188,3,24,48))),0,0,1200,630)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,255,81,72))),70,70,9,490)
  $small=[System.Drawing.Font]::new('Arial',18,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  $large=[System.Drawing.Font]::new('Arial',54,[System.Drawing.FontStyle]::Bold,[System.Drawing.GraphicsUnit]::Pixel)
  $numberFont=[System.Drawing.Font]::new('Georgia',25,[System.Drawing.FontStyle]::Italic,[System.Drawing.GraphicsUnit]::Pixel)
  $white=[System.Drawing.Brushes]::White; $red=New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,255,81,72))
  $g.DrawString('STUDENCI POLSKA · PORADNIK',$small,$white,112,92)
  $format=New-Object System.Drawing.StringFormat
  $format.Trimming='Word'; $format.FormatFlags=0
  $g.DrawString($title,$large,$white,(New-Object System.Drawing.RectangleF 108,190,930,260),$format)
  $g.DrawString($number,$numberFont,$red,106,500)
  $g.DrawString('GRUPYSTUDENCKIE.PL',$small,$white,810,510)
  $encoder=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
  $parameters=New-Object System.Drawing.Imaging.EncoderParameters 1
  $parameters.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),86L
  $bmp.Save($target,$encoder,$parameters)
  $format.Dispose();$small.Dispose();$large.Dispose();$numberFont.Dispose();$red.Dispose();$g.Dispose();$bmp.Dispose();$src.Dispose()
}

for($i=0;$i -lt $items.Count;$i++){
  $item=$items[$i]
  Save-Card (Join-Path $root "assets\share\$($item[2]).jpg") (Join-Path $out "$($item[0]).jpg") $item[1] ("PORADNIK {0:D2}" -f ($i+1))
}

$community=Join-Path $root 'assets\community-studenci-polska.jpg'
Save-Card $community (Join-Path $root 'assets\share\home.jpg') 'Miasta, grupy i wydarzenia studenckie' '43 MIASTA'
Save-Card $community (Join-Path $root 'assets\share\guides.jpg') 'Poradniki dla studentów' '18 TEMATÓW'
Write-Output "Generated $($items.Count + 2) social images"
