var Servient = require("@node-wot/core").Servient;
var MqttsClientFactory = require("@node-wot/binding-mqtt").MqttsClientFactory
//var rsa = require('node-rsa');
var fs = require('fs');
const express = require('express');
const app = express();
var router = express.Router();
var emparejamiento = require('./emparejamiento.js');
var config = require('./config.json');
const PUB_KEY = './keys5/public.key';
var rsa = require('node-rsa');
const controllerID = 1;

Helpers = require("@node-wot/core").Helpers;

//Creamos el Servient y el protocolo MQTT

let servient = new Servient();
servient.addClientFactory(new MqttsClientFactory({
    rejectUnauthorized: false
}));

//Thing description

let td = `{
    "@context": "https://www.w3.org/2019/wot/td/v1",
    "title": "AireAcondicionado",
    "id": "urn:dev:wot:mqtt:AireAcondicionado",
    "properties": {
        "temperatura": {
            "type": "integer",
            "forms": [{
                "href": "mqtts://localhost:8443/AireAcondicionado/properties/temperatura"
            }]
        },
        "allowedID": {
            "type": "number",
            "forms": [{
                "href": "mqtts://localhost:8443/AireAcondicionado/properties/allowedID"
            }]
        }
    },
    "actions" : {
        "apagar": {
            "forms": [
                {"href": "mqtts://localhost:8443/AireAcondicionado/actions/apagar"}
            ]
        },
        "incrementar": {
            "forms": [
                {"href": "mqtts://localhost:8443/AireAcondicionado/actions/incrementar"}
            ]
        },
        "decrementar": {
            "forms": [
                {"href": "mqtts://localhost:8443/AireAcondicionado/actions/decrementar"}
            ]
        },
        "leerTemperatura": {
            "forms": [
                {"href": "mqtts://localhost:8443/AireAcondicionado/actions/leerTemperatura"}
            ]
        }
    }, 
    "events": {
        "estadoTemperatura": {
            "type": "integer",
            "forms": [
                {"href": "mqtts://localhost:8443/AireAcondicionado/events/estadoTemperatura"}
            ]
        } 
    } 
}`;



/*var privateKey = new rsa();

var private = fs.readFileSync('./keys9/ca.key', 'utf-8');

privateKey.importKey(private);

var encryptedID = privateKey.encryptPrivate(controllerID, 'base64');

console.log(encryptedID);*/

var publicKey = new rsa();


var public = fs.readFileSync('./keys9/public.key', 'utf-8');


publicKey.importKey(public);

var encryptedID = publicKey.encrypt(controllerID, 'base64');





try {


    servient.start().then((WoT) => {
        WoT.consume(JSON.parse(td)).then((thing) => {
            console.info(td);

            console.log(emparejamiento.pairing(encryptedID));

            if (emparejamiento.pairing(encryptedID) == true) {

                thing.subscribeEvent(
                    "estadoTemperatura",
                    (temperatura) => console.info("value:", temperatura),
                    (e) => console.error("Error: %s", e),
                    () => console.info("Completado")
                );



                console.info("Suscrito");

                app.set('view engine', 'jade');


                router.get("/subirTemperatura", function (req, res) {
                    thing.invokeAction('incrementar');
                    res.redirect('/mando');
                });

                router.get("/bajarTemperatura", function (req, res) {
                    thing.invokeAction('decrementar');
                    res.redirect('/mando');
                });

                /*router.get("/apagarCliente", function (req, res) {
                    //servient.destroyThing(thing.getThingDescription().id).then(x => console.log('Aire apagado: ' + x));
                    //servient.shutdown();
                    //thing.unsubscribeEvent("estadoTemperatura");
                    //thing.unsubscribeEvent('estadoAlarma');
                    res.redirect('/mando');
                });*/

            }else{
                console.log('EMPAREJAMIENTO FALLIDO');
            }
            module.exports = router;
        });
    });


} catch (err) {
    console.error("Error en el script: ", err);
}