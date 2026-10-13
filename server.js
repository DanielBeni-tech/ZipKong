const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const PAY_FILE = path.join(DATA_DIR, 'payments.json');
const PAY_NUMBER = '654516028'; // compte MoMo direct (pas d API MTN/Orange)
const PAY_AMOUNT = 99000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PAY_FILE)) fs.writeFileSync(PAY_FILE, '[]');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/compress', (req, res) => res.sendFile(path.join(__dirname, 'compress.html')));
app.get('/convert', (req, res) => res.sendFile(path.join(__dirname, 'convert.html')));

// Infos de paiement (affichees au client)
app.get('/api/pay/info', (req, res) => {
  res.json({ number: PAY_NUMBER, amount: PAY_AMOUNT, currency: 'FCFA', method: 'MTN MoMo', ussd: '*126#' });
});

// Enregistrement d un paiement (ID de transaction saisi par l utilisateur)
app.post('/api/pay', (req, res) => {
  const { method, number, txid, file } = req.body || {};
  if (!txid || String(txid).trim().length < 4) {
    return res.status(400).json({ ok: false, error: 'ID de transaction invalide.' });
  }
  if (!number || String(number).replace(/[\s.-]/g, '').length < 8) {
    return res.status(400).json({ ok: false, error: 'Numero Mobile Money invalide.' });
  }
  let payments = [];
  try { payments = JSON.parse(fs.readFileSync(PAY_FILE, 'utf8')); } catch (e) { payments = []; }
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    date: new Date().toISOString(),
    method: method === 'om' ? 'Orange Money' : 'MTN MoMo',
    payerNumber: String(number).replace(/[\s.-]/g, ''),
    txid: String(txid).trim(),
    file: file || null,
    amount: PAY_AMOUNT,
    expectedOn: PAY_NUMBER,
    verified: false
  };
  payments.push(entry);
  fs.writeFileSync(PAY_FILE, JSON.stringify(payments, null, 2));
  console.log('[PAY]', entry.method, entry.payerNumber, 'tx', entry.txid);
  res.json({ ok: true, id: entry.id, message: 'Paiement enregistre. Telechargement debloque.' });
});

// Consultation des paiements (pour verification manuelle dans l app MoMo)
app.get('/api/payments', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(PAY_FILE, 'utf8'))); }
  catch (e) { res.json([]); }
});

// IPs publiques du serveur (utile pour la facturation / debug)
app.get('/api/pay/ips', (req, res) => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  res.json({ local: ips, public: process.env.PUBLIC_IP || null });
});

app.listen(PORT, () => {
  console.log('CoCo demarre sur http://localhost:' + PORT);
  console.log('Paiement MoMo direct sur le numero ' + PAY_NUMBER + ' (' + PAY_AMOUNT + ' FCFA)');
});
