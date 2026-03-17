$root = "e:\AIProjects\体育彩票计算器"
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:${port}/")
$listener.Start()
Write-Host "Server running at http://localhost:${port}"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $localPath = $ctx.Request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }
    $filePath = Join-Path $root ($localPath.TrimStart("/"))

    if (Test-Path $filePath) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $ct = "application/octet-stream"
        if ($ext -eq ".html") { $ct = "text/html; charset=utf-8" }
        if ($ext -eq ".css") { $ct = "text/css; charset=utf-8" }
        if ($ext -eq ".js") { $ct = "application/javascript; charset=utf-8" }
        if ($ext -eq ".json") { $ct = "application/json; charset=utf-8" }
        $ctx.Response.ContentType = $ct
        $ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*")
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.OutputStream.Close()
}
