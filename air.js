var Servient = require('@node-wot/core').Servient;
var MqttBrokerServer = require('@node-wot/binding-mqtt').MqttBrokerServer;
const http = require('http');
var fs = require('fs');
const express = require('express');
const app = express();
const SECURE_CERT = './keys9/server.crt';
const SECURE_KEY = './keys9/server.key';
var mando = require('./mando');
//var mando2 = require('./mando2');
var router = express.Router();
const https = require('https');
var config = require('./config.json');

//Creamos el servient y el protocolo MQTT

let brokerUri = 'mqtts://localhost:8443';
let servient = new Servient();
let brokerServer = new MqttBrokerServer(brokerUri, undefined, undefined, undefined, undefined, false);
servient.addServer(brokerServer);


servient.start().then((WoT) => {

    var temperatura;
    var alarma;
    var alarmaState;
    

    WoT.produce({
        title: 'AireAcondicionado',
        description: 'Aparato de aire acondicionado que muestra la temperatura',
        '@context': [
            'https://www.w3.org/2019/wot/td/v1',
        ],
        properties: {
            temperatura: {
                type: 'integer',
                observable: true,
                description: 'valor actual de la temperatura'
            },
            alarma: {
                type: 'boolean',
                description: 'Estado de la alarma'
            },
            allowedID: {
                type: 'number',
                description: 'Allowed IDs'
            }
        },
        actions: {
            apagar: {
                description: 'Apaga o enciende el aire'
            },
            incrementar: {
                description: 'Sube la temperatura'
            },
            decrementar: {
                description: 'Baja la temperatura'
            },
            alarma: {
                description: 'Activa o desactiva la alarma'
            },
            leerTemperatura: {
                description: 'Lee la temeperatura actual'
            }
        },
        events: {
            estadoTemperatura: {
                description: 'Muestra la temperatura actual'
            },
            estadoAlarma: {
                description: 'Estado de la alarma'
            }
        }



    }).then((thing) => {
        console.log('Producido ' + thing.getThingDescription().title);



        //Inicializamos los valores de las propiedades
        temperatura = 25;
        alarma = false;
        alarmaState = 'inactiva';
        //allowedIDs = [1];

        //Manejadores de las propiedades
        thing.setPropertyReadHandler('temperatura', async () => temperatura);
        thing.setPropertyReadHandler('alarma', async () => alarma);
        //thing.setPropertyReadHandler('allowedID', async () => allowedIDs);

        thing.setActionHandler('incrementar', () => {
            console.log('Subiendo temperatura');
            temperatura++;
        });

        thing.setActionHandler('decrementar', () => {
            console.log('Bajando temperatura');
            temperatura--;
        });

        thing.setActionHandler('alarma', async () => {
            //let tempTemperatura =  await thing.readProperty('temperatura');
            console.log('HHHHHHHHHHHHHHHHHHH'+temperatura);
            //console.log('LA ALARMA ES ESTA: '+alarma);
            if (temperatura > 30) {
                alarma = true;
                await thing.invokeAction('decrementar');
                console.log('ESTOY AQUIIIIIIIIIIIIIIII');
                console.log('La temperatura es muy alta');
                
                
                alarmaState = (alarma == false ? 'inactiva' : 'activa');


            } else if (temperatura < 20) {
                alarma = true;
                await thing.invokeAction('incrementar');
                console.log('La temperatura es muy baja');
                
                
                console.log('YYYYYYYYYYYYYYYYYY'+alarma);
                alarmaState = (alarma == false ? 'inactiva' : 'activa');

            } else {
                alarma = false;
                alarmaState = (alarma == false ? 'inactiva' : 'activa');
            }



        });






        router.get('/acciones/encenderCliente', function (req, res) {
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + 'ready');

                setInterval(() => {
                    thing.emitEvent('estadoTemperatura', temperatura);
                    console.info('Temperatura', temperatura);
                }, 1000);

                setInterval(() => {
                    thing.emitEvent('estadoAlarma', alarma);
                    console.info('Estado de la alarma', alarma);
                }, 1000);


            });
            res.redirect('/mando');
        });


        //Plasmamos los datos en web

        app.set('view engine', 'jade');
        app.unsubscribe(express.json());
        app.use(express.urlencoded());


        router.get('/', function (req, res) {
            res.render('air', {
                title: 'Aparato de aire',
                temperature: temperatura
            });
        });
        

        router.get("/mando", function (req, res) {
            res.render("mando", {
                title: "Mando del aire",
                temperature: temperatura
            });
        });

        router.get("/alarma", function (req, res) {
            res.render("alarma", {
                title: "Mando del aire",
                estadoAlarma: alarmaState,
                temperature: temperatura
            });
        });

        router.get("/acciones/apagarCliente", function (req, res) {
            //servient.destroyThing(thing.getThingDescription().id).then(x => console.log('Aire apagado: ' + x));
            //servient.shutdown();
            /*thing.unsubscribeEvent('estadoTemperatura');
            thing.unsubscribeEvent('estadoAlarma');*/
            servient.destroyThing(thing.getThingDescription().id);
            res.redirect('/mando');
        });

        app.use('/acciones', require('./mando'));
        app.use(router);

        //app.listen(3000);


        const sslServer = https.createServer({
            key: fs.readFileSync(SECURE_KEY),
            cert: fs.readFileSync(SECURE_CERT)
        }, app);

        sslServer.listen(3000);

        app.get("/alarma", function (req, res) {
            res.render("alarma", {
                title: 'Alarma',
                estadoAlarma: alarmaState

            });
        });


    }).catch((e) => {
        console.log(e);
    });

});