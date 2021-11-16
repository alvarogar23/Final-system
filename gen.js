var rsa = require('node-rsa');

var fs = require('fs');

function generatePair(){

    var key = new rsa().generateKeyPair();

    var publicKey = key.exportKey('public');

    var privateKey = key.exportKey('private');

    fs.openSync('./keys9/public.key', 'w');
    fs.writeFileSync('./keys9/public.key', publicKey, 'utf-8');

    fs.openSync('./keys9/ca.key', 'w');
    fs.writeFileSync('./keys9/ca.key', privateKey, 'utf-8');
}

generatePair();