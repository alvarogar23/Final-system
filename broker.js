var mosca = require('mosca')
var fs = require('fs');
var SECURE_KEY = './keys3/server.key';
var SECURE_CERT = './keys3/server.crt';
//var CA_KEY = './keys/my_ca.crt';


  
const settings = {
  
  secure: {
    port: 8443,
    keyPath: SECURE_KEY,
    certPath: SECURE_CERT,
  }
  //port: 1883
};
  

var server = new mosca.Server(settings);
server.on('ready', setup);

server.on('clientConnected', (client) => {
  console.log('client connected: ' + client.id)
});

server.on('published', (packet) => {
  console.log( 'published : ' + JSON.stringify(packet));
});

// Lanzado cuando el servidor esta listo

function setup() {
  console.log('Mosca server is up and running')
}