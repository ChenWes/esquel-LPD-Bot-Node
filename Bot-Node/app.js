var restify = require('restify');
var builder = require('botbuilder');

var StyleSearchHelper = require('./service/garment_style_search');

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
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
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
                session.dialogData.searchType = 'garmentstyle';
                next({ response: garmentStyleEntity.entity });                
            } else {
                // no entities detected, ask user for a destination
                builder.Prompts.text(session, 'Please enter garment style no');
            }
        },
        function (session, results) {
            var garmentStyleNo = results.response;
            // var message = 'Looking for garment style';
            // if (session.dialogData.searchType === 'garmentstyle') {
            //     message += ' near %s airport...';
            // } else {
            //     message += ' in %s...';
            // }

            // session.send(message, garmentStyleNo);

            // Async search WebAPI
            StyleSearchHelper
                .searchGarmentStyle(garmentStyleNo)
                .then((GarmentStyles) => {
                    // args
                    // session.send('I found %d hotels:', hotels.length);
                    // child function process the message attachment
                    var message = new builder.Message()
                        .attachmentLayout(builder.AttachmentLayout.carousel)
                        .attachments(GarmentStyles.map(garmentStyleAttachment));

                    session.send(message);

                    // End
                    session.endDialog();
                });
        }
    ])
    // .matches('SearchFabric', (session, args) => {
    //     // retrieve hotel name from matched entities
    //     var hotelEntity = builder.EntityRecognizer.findEntity(args.entities, 'Hotel');
    //     if (hotelEntity) {
    //         session.send('Looking for reviews of \'%s\'...', hotelEntity.entity);
    //         Store.searchHotelReviews(hotelEntity.entity)
    //             .then((reviews) => {
    //                 var message = new builder.Message()
    //                     .attachmentLayout(builder.AttachmentLayout.carousel)
    //                     .attachments(reviews.map(reviewAsAttachment));
    //                 session.send(message);
    //             });
    //     }
    // })
    .matches('Hello', builder.DialogAction.send('Hi! Try asking me things like \'search germent style XXX\', \'search style XXX\' or \'style XXX\''))
    .onDefault((session) => {
        session.send('sorry , i have no idea what you talking about.', session.message.text);
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

// garment style Helpers
function garmentStyleAttachment(garmentstyle) {
    return new builder.HeroCard()
        .title(garmentstyle.name)
        .subtitle('%d stars. %d reviews. From $%d per night.', garmentstyle.rating, garmentstyle.numberOfReviews, garmentstyle.priceStarting)
        .images([new builder.CardImage().url(garmentstyle.image)])
        .buttons([
            new builder.CardAction()
                .title('Primary Fabric')
                .type('openUrl')
                .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(garmentstyle.location))
        ]);
}

// function reviewAsAttachment(review) {
//     return new builder.ThumbnailCard()
//         .title(review.title)
//         .text(review.text)
//         .images([new builder.CardImage().url(review.image)]);
// }

//=========================================================
// Bots Dialogs
//=========================================================

// bot.dialog('/', function (session) {
//     session.send("Esquel LPD Project Bot");
// });