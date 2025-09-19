# Create icons directory if it doesn't exist
$iconsDir = "public\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null
}

# Sizes we need for the manifest
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

# Create a simple icon for each size
foreach ($size in $sizes) {
    $outputPath = Join-Path $iconsDir "icon-${size}x${size}.png"
    
    # Create a simple colored square with the letter 'U' in the center
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Create a gradient background
    $gradientBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        [System.Drawing.Color]::FromArgb(99, 102, 241),  # #6366f1
        [System.Drawing.Color]::FromArgb(139, 92, 246)   # #8b5cf6
    )
    
    # Fill the background with the gradient
    $graphics.FillRectangle($gradientBrush, 0, 0, $size, $size)
    
    # Add the 'U' text
    $fontSize = [int]($size * 0.4)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $graphics.DrawString("U", $font, $brush, $rect, $stringFormat)
    
    # Save the image
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Created icon: $outputPath"
}

Write-Host "All icons have been generated in the $iconsDir directory."
