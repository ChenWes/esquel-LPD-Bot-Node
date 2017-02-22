var restify = require('restify');
var builder = require('botbuilder');

var StyleSearchHelper = require('./service/garment_style_search');
var FabricSearchHelper = require('./service/fabric_search');
var TrimSearchHelper = require('./service/trim_search');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: "63e90b31-5983-42cc-b4f4-ed5bffb95b98",
    appPassword: "7o4rYURkhH9Fuvf4TxYiswk"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
const LuisModelUrl = process.env.LUIS_MODEL_URL;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v2.0/apps/a9dca225-cf60-4d88-ba19-873f008c204d?subscription-key=f21ea5607c6b43589c12e6099b0a9614&verbose=true');
bot.dialog('/', new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('SearchGarmentStyle', [
        function (session, args, next) {
            session.send('hi ,we are analyzing your message: \'%s\' for search garment style', session.message.text);

            // try extracting entities
            var garmentStyleEntity = builder.EntityRecognizer.findEntity(args.entities, 'GarmentStyleNo');
            if (garmentStyleEntity) {
                // garment style entity detected, continue to next step
                // session.send('have garment style: \'%s\'',garmentStyleEntity.entity);
                // session.dialogData.searchType = 'garmentstyle';//just a parameter for next function
                next({ response: garmentStyleEntity.entity });
            } else {
                // no entities detected, ask user for a garment style, same as get parameter from Luis
                builder.Prompts.text(session, 'Please enter garment style no');
            }
        },
        function (session, results) {
            var garmentStyleNo = results.response;
            garmentStyleNo = garmentStyleNo.replace(/\s+/g, "");
            // we can get parameter from dialogData
            // var message = 'Looking for garment style';
            // if (session.dialogData.searchType === 'garmentstyle') {
            //     message += ' near %s airport...';
            // } else {
            //     message += ' in %s...';
            // }
            // session.send(garmentStyleNo);

            // Async search WebAPI
            StyleSearchHelper
                .searchGarmentStyle(garmentStyleNo)
                .then((GarmentStyles) => {
                    //check garment style
                    if (GarmentStyles && GarmentStyles.length == 0) {
                        var message = new builder.Message()
                            .text('can not found garment style \" %s \"', garmentStyleNo);
                        session.send(message);
                    }
                    else {
                        //foreach and send message
                        for (var getstyle of GarmentStyles) {
                            // add message
                            var message = new builder.Message()
                                .text(getstyle.linePlanProducts.productID + '(' + getstyle.linePlanProducts.productVersion + getstyle.linePlanProducts.productVersionSerialNo + ')')
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(getstyle.linePlanProducts.productMaterialConfigs.map(garmentStyleColorwayAttachment));
                            //send message
                            session.send(message);
                        }
                    }
                    // End dialog
                    session.endDialog();
                });
        }
    ])
    .matches('SearchFabric', [
        function (session, args, next) {
            session.send('hi ,we are analyzing your message: \'%s\' for search fabric', session.message.text);

            // try extracting entities
            var fabricEntity = builder.EntityRecognizer.findEntity(args.entities, 'FabricNo');
            if (fabricEntity) {
                next({ response: fabricEntity.entity });
            } else {
                // no entities detected, ask user for a fabric, same as get parameter from Luis
                builder.Prompts.text(session, 'Please enter fabric no');
            }
        },
        function (session, results) {
            var fabricNo = results.response;
            fabricNo = fabricNo.replace(/\s+/g, "");

            // Async search WebAPI
            FabricSearchHelper
                .searchFabric(fabricNo)
                .then((Fabrics) => {
                    //check garment style
                    if (Fabrics && Fabrics.length == 0) {
                        var message = new builder.Message()
                            .text('can not found fabric \" %s \"', fabricNo);
                        session.send(message);
                    }
                    else {
                        //foreach and send message                        
                        for (var getfabric of Fabrics) {
                            // add message
                            var message = new builder.Message()
                                .attachmentLayout(builder.AttachmentLayout.carousel)
                                .attachments(Fabrics.map(fabricAttachment));
                            //send message
                            session.send(message);
                        }
                    }
                    // End dialog
                    session.endDialog();
                });
        }
    ])
    .matches('SearchTrim', [
        function (session, args, next) {
            session.send('hi ,we are analyzing your message: \'%s\' for search trim', session.message.text);

            // try extracting entities
            var trimEntity = builder.EntityRecognizer.findEntity(args.entities, 'TrimNo');
            if (trimEntity) {
                next({ response: trimEntity.entity });
            } else {
                // no entities detected, ask user for a trim, same as get parameter from Luis
                builder.Prompts.text(session, 'Please enter trim no');
            }
        },
        function (session, results) {
            var trimNo = results.response;
            trimNo = trimNo.replace(/\s+/g, "");

            // Async search WebAPI
            TrimSearchHelper
                .searchTrim(trimNo)
                .then((Trims) => {
                    //check trim
                    if (Trims && Trims.length == 0) {
                        var message = new builder.Message()
                            .text('can not found trim \" %s \"', trimNo);
                        session.send(message);
                    }
                    else {
                        //foreach and send message
                        // for (var gettrim of Trims) {
                        // add message
                        var message = new builder.Message()
                            .attachmentLayout(builder.AttachmentLayout.carousel)
                            .attachments(Trims.map(trimAttachment));
                        //send message
                        session.send(message);
                        // }
                    }
                    // End dialog
                    session.endDialog();
                });
        }
    ])
    .matches('Hello', builder.DialogAction.send('hi! try asking me things like \'search germent style XXX\', \'search style XXX\' or \'style XXX\''))
    .onDefault((session) => {
        session.send('sorry , i have no idea what you talking about.\"%s\"', session.message.text);
    }));


if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService
                .getCorrectedText(session.message.text)
                .then(text => {
                    session.message.text = text;
                    next();
                })
                .catch((error) => {
                    console.error(error);
                    next();
                });
        }
    });
}

// garment style colorway to card Helpers
function garmentStyleColorwayAttachment(colorway) {
    return new builder.ThumbnailCard()
        .title(colorway.colorway + "(" + colorway.optionNo + ")")
        .subtitle(colorway.primaryFabricID)
        .text(colorway.pluNumber)
        .images([new builder.CardImage().url(colorway.PrimaryFabricImageUrl)])
        .buttons([
            new builder.CardAction()
                .title('View Primary Fabric')
                .type('imBack')
                .value('search fabric ' + colorway.primaryFabricID),
            new builder.CardAction()
                .title('View Fabric Image')
                .type('openUrl')
                .value(colorway.PrimaryFabricImageUrl)
        ]);
}

// fabric to card Helplers
function fabricAttachment(fabric) {
    return new builder.HeroCard()
        .title(fabric.fabricID)
        .subtitle(fabric.fabricNo)
        .text(fabric.longDescriptions.join(' '))
        .images([
            new builder.CardImage().url(fabric.imageURL)])
        .buttons([
            new builder.CardAction()
                .title('View Image')
                .type('openUrl')
                .value(fabric.imageURL)
        ]);
}

// trim to card Helplers
function trimAttachment(trim) {
    return new builder.HeroCard()
        .title(trim.apparelTrimID)
        .subtitle(trim.apparelTrimID)
        .text(trim.longDescriptions.join(' '))
        .images([
            new builder.CardImage().url(trim.imageURL)])
        .buttons([
            new builder.CardAction()
                .title('View Image')
                .type('openUrl')
                .value(trim.imageURL)
        ]);
}

//=========================================================
// Bots Dialogs
//=========================================================

// bot.dialog('/', function (session) {
//     session.send("Esquel LPD Project Bot");
// });