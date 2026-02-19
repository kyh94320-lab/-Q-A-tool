# build_data.ps1
# Extracts text from .hwpx files and creates a data.js file for the frontend.

$param_path = "."
$output_file = "data.js"

# Function to extract text from a single .hwpx file
function Get-HwpxText {
    param (
        [string]$FilePath
    )

    $tempDir = Join-Path $env:TEMP ([System.Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    
    try {
        # .hwpx is a zip file. We need to unzip it.
        # Copy to a temp zip file first to avoid locking issues or extension issues
        $tempZip = Join-Path $tempDir "content.zip"
        Copy-Item -Path $FilePath -Destination $tempZip
        
        Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
        
        # The main content is usually in Contents/section0.xml
        $contentXmlPath = Join-Path $tempDir "Contents/section0.xml"
        
        if (Test-Path $contentXmlPath) {
            # Read XML content as raw string
            $rawXml = Get-Content -Path $contentXmlPath -Raw -Encoding UTF8
            
            # Use Regex to find all <hp:t>...</hp:t> content
            # Pattern: <hp:t>(.*?)</hp:t>
            $matches = [regex]::Matches($rawXml, "<hp:t>(.*?)</hp:t>")
            
            $textBuilder = [System.Text.StringBuilder]::new()
            
            foreach ($match in $matches) {
                # Group 1 is the content
                $extracted = $match.Groups[1].Value
                
                # Check for CDATA or basic text
                # If it looks like unicode, it keeps it. 
                # We might need to handle &lt; &gt; etc if they exist, but usually standard XML entities.
                # PowerShell "Add-Type -AssemblyName System.Web" -> [System.Web.HttpUtility]::HtmlDecode($extracted)
                # But for now let's just append space.
                
                if (-not [string]::IsNullOrWhiteSpace($extracted)) {
                    [void]$textBuilder.Append($extracted + " ")
                }
            }
            
            $text = $textBuilder.ToString()
            
            # Basic cleanup
            $text = $text -replace "\s+", " "
            return $text.Trim()
        } else {
            Write-Warning "Could not find content XML in $FilePath"
            return ""
        }
    }
    catch {
        Write-Error "Failed to extract $FilePath : $_"
        return ""
    }
    finally {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# structure to hold the data
$data = @()

# Get all .hwpx files
$files = Get-ChildItem -Path $param_path -Filter "*.hwpx" -Recurse

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    $content = Get-HwpxText -FilePath $file.FullName
    
    # Add to data array
    $data += @{
        filename = $file.Name
        path = $file.FullName # You might want relative path for privacy/portability
        content = $content
    }
}

# Convert to JSON
$json = $data | ConvertTo-Json -Depth 5 -Compress

# Wrap in a JS variable assignment
$jsContent = "window.PROJECT_DATA = $json;"

# Write to file with UTF-8 encoding (NO BOM is safer for web)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $param_path $output_file), $jsContent, $utf8NoBom)

Write-Host "Done! Data saved to $output_file"
