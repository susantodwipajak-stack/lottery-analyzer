 = 'e:\AI文档\体育彩票计算器'
 = New-Object System.Net.HttpListener
.Prefixes.Add('http://localhost:8080/')
.Start()
Write-Host 'Server running at http://localhost:8080'
while (.IsListening) {
     = .GetContext()
     = .Request.Url.LocalPath
    if ( -eq '/') {  = '/index.html' }
     = Join-Path  (.TrimStart('/'))
    if (Test-Path ) {
         = [System.IO.Path]::GetExtension()
         = 'application/octet-stream'
        if ( -eq '.html') {  = 'text/html; charset=utf-8' }
        if ( -eq '.css') {  = 'text/css; charset=utf-8' }
        if ( -eq '.js') {  = 'application/javascript; charset=utf-8' }
        .Response.ContentType = 
        .Response.Headers.Add('Access-Control-Allow-Origin', '*')
         = [System.IO.File]::ReadAllBytes()
        .Response.OutputStream.Write(, 0, .Length)
    } else {
        .Response.StatusCode = 404
    }
    .Response.OutputStream.Close()
}