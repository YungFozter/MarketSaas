const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const bin = fs.existsSync(chromePath) ? chromePath : edgePath;

function compileHtmlToPdf(htmlRelativePath, pdfRelativePath) {
  const fullHtml = 'file:///' + path.resolve(__dirname, '../public', htmlRelativePath).replace(/\\/g, '/');
  const fullPdf = path.resolve(__dirname, '../public', pdfRelativePath);

  console.log(`Compilando ${htmlRelativePath} -> ${pdfRelativePath}...`);
  try {
    execSync(`"${bin}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${fullPdf}" "${fullHtml}"`, { stdio: 'inherit' });
    if (fs.existsSync(fullPdf)) {
      const stats = fs.statSync(fullPdf);
      console.log(`✓ ÉXITO: ${pdfRelativePath} generado (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`✗ ERROR: No se encontró el archivo generado en ${fullPdf}`);
    }
  } catch (err) {
    console.error(`✗ ERROR compilando ${htmlRelativePath}:`, err.message);
  }
}

// 1. Dossier Plataforma
if (fs.existsSync(path.resolve(__dirname, '../public/dossier-plataforma.html'))) {
  compileHtmlToPdf('dossier-plataforma.html', 'MarketSaaS_Dossier_Plataforma.pdf');
}

// 2. Guía Vista Vecino
if (fs.existsSync(path.resolve(__dirname, '../public/guia-vista-vecino.html'))) {
  compileHtmlToPdf('guia-vista-vecino.html', 'MarketSaaS_Guia_Vista_Vecino.pdf');
}

// 3. Manual Vista Dueño
if (fs.existsSync(path.resolve(__dirname, '../public/manual-vista-dueno.html'))) {
  compileHtmlToPdf('manual-vista-dueno.html', 'MarketSaaS_Manual_Vista_Dueno.pdf');
}
