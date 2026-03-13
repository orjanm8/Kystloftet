#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Kystloftet – start lokal server
#
#  Kjør denne filen én gang, åpne deretter nettleseren på:
#  http://localhost:8080
#
#  Stopp serveren med Ctrl+C i terminalen.
# ─────────────────────────────────────────────────────────────

PORT=8080
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ⚓  Kystloftet starter…"
echo ""
echo "  Åpne nettleseren og gå til:"
echo "  → http://localhost:$PORT"
echo ""
echo "  Trykk Ctrl+C for å stoppe."
echo ""

# Forsøk Python 3 (finnes på nesten alle maskiner)
if command -v python3 &>/dev/null; then
  cd "$DIR" && python3 -m http.server $PORT

# Fallback: Python 2
elif command -v python &>/dev/null; then
  cd "$DIR" && python -m SimpleHTTPServer $PORT

# Fallback: Node.js
elif command -v node &>/dev/null; then
  node -e "
    const http=require('http'), fs=require('fs'), path=require('path');
    http.createServer((req,res)=>{
      let f=path.join('$DIR', req.url==='/'?'index.html':req.url);
      fs.readFile(f,(e,d)=>{ if(e){res.writeHead(404);res.end();}
        else{res.writeHead(200);res.end(d);} });
    }).listen($PORT);
  "

else
  echo "  FEIL: Fant verken Python eller Node.js."
  echo "  Installer Python 3 og prøv igjen."
  exit 1
fi
