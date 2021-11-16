var fs = require('fs');
var rsa = require('node-rsa');
var config = require('./config.json');

var privateKey = new rsa();

var private = fs.readFileSync('./keys9/ca.key', 'utf-8');

privateKey.importKey(private);

module.exports.pairing = function pairing (id){
    var decryptedID = privateKey.decrypt(id, 'utf8');
    if(config.allowedIDs.includes(decryptedID)){
        return true;
    }else{
        return false;
    }
}
