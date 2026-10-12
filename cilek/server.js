const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;

// Statik dosyaları sun
app.use(express.static(path.join(__dirname, 'public')));

// HTTP sunucusu oluştur (WebSocket için şart)
const server = http.createServer(app);

// PeerJS sinyal sunucusu
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs',
  allow_discovery: true,
  alive_timeout: 60000,
  expire_timeout: 30000,
  concurrent_limit: 50,
  key: 'peerjs'
});

app.use(peerServer);

// Bağlı peer'ları gösteren debug endpoint
app.get('/api/peers', function(req, res) {
  try {
    var clients = peerServer._clients ? Object.keys(peerServer._clients) : [];
    // PeerJS v1 uses _clients or realm
    if (clients.length === 0 && peerServer._realm) {
      var clientsMap = peerServer._realm.getClientsIds();
      clients = clientsMap || [];
    }
    res.json({
      connected_peers: clients,
      count: clients.length,
      server_time: new Date().toISOString()
    });
  } catch(e) {
    res.json({
      error: e.message,
      note: 'Could not list peers'
    });
  }
});

// Health check
app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Peer bağlantı logları
peerServer.on('connection', function(client) {
  console.log('[' + new Date().toISOString() + '] ✅ Peer bağlandı: ' + client.getId());
});

peerServer.on('disconnect', function(client) {
  console.log('[' + new Date().toISOString() + '] ❌ Peer ayrıldı: ' + client.getId());
});

// Sunucuyu başlat
server.listen(PORT, function() {
  console.log('🍓 Çilek sunucusu çalışıyor: http://localhost:' + PORT);
  console.log('📡 PeerJS sinyal sunucusu /peerjs yolunda aktif');
  console.log('🔍 Debug: http://localhost:' + PORT + '/api/peers');
});
