Add-Type -AssemblyName System.Drawing

function Create-PngIcon {
    param(
        [int]$Size,
        [string]$Path
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Background
    $graphics.Clear([System.Drawing.Color]::Black)
    
    # Draw simple text
    $font = New-Object System.Drawing.Font("Arial", ($Size / 4), [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    
    # Measure text to center
    $text = "CRM"
    $textSize = $graphics.MeasureString($text, $font)
    $x = ($Size - $textSize.Width) / 2
    $y = ($Size - $textSize.Height) / 2
    
    $graphics.DrawString($text, $font, $brush, $x, $y)
    
    # Save
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Dispose
    $graphics.Dispose()
    $bmp.Dispose()
    $font.Dispose()
}

Create-PngIcon -Size 192 -Path "D:\dev\samatech-crm\public\icon-192.png"
Create-PngIcon -Size 512 -Path "D:\dev\samatech-crm\public\icon-512.png"

Write-Host "Real PNG icons generated successfully."
