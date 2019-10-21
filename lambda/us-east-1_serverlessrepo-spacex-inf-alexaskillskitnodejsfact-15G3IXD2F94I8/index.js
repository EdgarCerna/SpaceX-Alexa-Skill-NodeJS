/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    
    const speechOutput = `Welcome to Space X, ask a question.`;
    const repromptOutput = `You can say "Tell me about rockets" for example, or say "Cancel".`;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const LatestLaunchIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'LatestLaunchIntent';
  },
  async handle(handlerInput) {
    const path = `/v3/launches/latest`;
    
    const response = await getSpacexData(path);
    console.log(response);
    
    const date = convertDateForSpeech(response.launch_date_unix);
    const speechOutput = "The latest launch of " + response.rocket.rocket_name + 
                          " flight number " + response.flight_number +
                          ", mission " + response.mission_name + " occurred on " +
                          date + ". Here's some information, " + response.details;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard("Latest SpaceX Launch", speechOutput)
      .getResponse();
  },
};

const UpcomingLaunchIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'UpcomingLaunchIntent';
  },
  async handle(handlerInput) {
    const path = `/v3/launches/upcoming`;
    
    const response = await getSpacexData(path);
    console.log('response0', response[0]);
    console.log('response0details', response[0].details);
    
    const date = convertDateForSpeech(response[0].launch_date_unix);
    const speechOutput = "On " + date + ", SpaceX will launch " + response[0].rocket.rocket_name +
                          " in mission " + response[0].mission_name + "... flight number " + response[0].flight_number + ". " + 
                          response[0].details;
    console.log("Speech Output", speechOutput);
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard("Upcoming SpaceX Launch", speechOutput)
      .getResponse();
  },
};

const SpacexSummaryIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'SpacexSummaryIntent';
  },
  async handle(handlerInput) {
    const path = `/v3/info`;
    
    const response = await getSpacexData(path);
    console.log(response);
    
    const speechOutput = response.summary;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard("SpaceX Summary", speechOutput)
      .getResponse();
  },
};

const SpacexLocationIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'SpacexLocationIntent';
  },
  async handle(handlerInput) {
    const path = `/v3/info`;
    
    const response = await getSpacexData(path);
    console.log(response);
    
    const speechOutput = "The Space X headquarters is located on " + response.headquarters.address + 
                          " in " + response.headquarters.city + ", " + response.headquarters.state;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard("SpaceX Headquarters", speechOutput)
      .getResponse();
  },
};

const SpacexEmployeesIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'SpacexEmployeesIntent';
  },
  async handle(handlerInput) {
    const path = `/v3/info`;
    
    const response = await getSpacexData(path);
    console.log(response);
    
    const speechOutput = "Roughly " + response.employees + " people work at Space X";
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard("SpaceX Employees", speechOutput)
      .getResponse();
  },
};

const SpacexRocketIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'SpacexRocketIntent';
  },
  async handle(handlerInput) {
    var path = `/v3/rockets`;
    
    const intent = handlerInput.requestEnvelope.request.intent;
    
    const rocketID = await intent.slots.SpacexRocket.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('rocketID', rocketID);
    
    path += "/" + rocketID;
    console.log('path', path);
    
    const response = await getSpacexData(path);
    console.log('Response', response);
    
    var activeBool;
     if (response.active) {
      activeBool = "active";
    } else {
      activeBool = "not active";
    }
    console.log(activeBool);
    
    var firstFlightDate = new Date(response.first_flight);
    var currentDate = new Date();
    var firstFlightSpeech;
    if (currentDate < firstFlightDate) {
      firstFlightSpeech = response.rocket_name + `'s first flight will be on `;
    } else {
      firstFlightSpeech = response.rocket_name + `'s first flight was on `;
    }
    
    const speechOutput = firstFlightSpeech + response.first_flight +
                          " in the " + response.country + ", it is currently " + activeBool +
                          ". It has a " + response.success_rate_pct + " percent success rate and costs " +
                          response.cost_per_launch + " dollars per launch. Here's some information .... " +
                          response.description;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withStandardCard(response.rocket_name, speechOutput, response.flickr_images[0], response.flickr_images[0])
      .withShouldEndSession(true)
      .getResponse();
  },
};

const LandingPadsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'LandingPadsIntent';
  },
  async handle(handlerInput) {
    var path = `/v3/landpads`;
    
    const intent = handlerInput.requestEnvelope.request.intent;
    
    const padID = await intent.slots.LandingPad.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('padID', padID);
    
    path += "/" + padID;
    console.log('path', path);
    
    const response = await getSpacexData(path);
    console.log('Response', response);
    
    const speechOutput = response.full_name + " is currently " + response.status + ". It is located in " + 
                          response.location.name + ", " + response.location.region + ". There has been " +
                          response.attempted_landings + " attempted landings, " + response.successful_landings +
                          " were successful " + ". Here's some information ... " +
                          response.details;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(response.full_name, speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const WhoIsIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'WhoIsIntent';
  },
  async handle(handlerInput) {
    var path = `/v3/info`;
    
    const intent = handlerInput.requestEnvelope.request.intent;
    
    const positionID = await intent.slots.position.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('positionID', positionID);
    
    const positionName = await intent.slots.position.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    console.log('positionName', positionName);
    
    const response = await getSpacexData(path);
    console.log('Response', response);
    
    var resPosition;
    if (positionID === 'founder') {
      resPosition = response.founder;
    } else if (positionID === 'cto_propulsion') {
      resPosition = response.cto_propulsion;
    } else if (positionID === 'ceo') {
      resPosition = response.ceo;
    } else if (positionID === 'cto') {
      resPosition = response.cto;
    } else if (positionID === 'coo') {
      resPosition = resPosition.coo;
    }
    console.log('resPosition', resPosition);
    
    const speechOutput = 'The ' + positionName + ' of Space X is ' + resPosition;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(positionName, speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const HistoricalEventIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'HistoricalEventIntent';
  },
  async handle(handlerInput) {
    const path = `/v3/history`;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    const response = await getSpacexData(path);
    console.log('response', response);
    
    var arrayInc = 0;
    var randomEvent = shuffleArray(response);
    console.log('shuffledResponse', randomEvent);
    console.log('selectedEvent', randomEvent[arrayInc]);
    
    var eventOutput;
    if (response[arrayInc].details.substring(0,3) === 'On ') {
      var eventOutput = randomEvent[arrayInc].details;
    } else {
      var eventOutput = 'On ' + convertDateForSpeech(response[arrayInc].event_date_unix) + " ... " + 
                        randomEvent[arrayInc].details;
    }
    
    const speechOutput = eventOutput + ' ... Would you like to hear another historical event?';
    
    arrayInc++;
    
    sessionAttributes.counter = arrayInc;
    sessionAttributes.array = randomEvent;
    sessionAttributes.intentName = 'historicalEvent';
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(response[arrayInc - 1].title, speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const LaunchesIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'LaunchesIntent';
  },
  async handle(handlerInput) {
    var path = `/v3/launches`;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    const intent = handlerInput.requestEnvelope.request.intent;
    
    const tenseID = await intent.slots.LaunchTense.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('tenseID', tenseID);
    
    path += "/" + tenseID;
    console.log('path', path);
    
    const response = await getSpacexData(path);
    console.log('Response', response);
    
    var arrayInc = 0;
    var shuffledLaunches = shuffleArray(response);
    
    var flightNumberArray = [];
    for (var i=0; i < shuffledLaunches.length; i++) {
      flightNumberArray[i] = shuffledLaunches[i].flight_number;
    }
    
    // var randomLaunch = shuffledLaunches[arrayInc];
    console.log('selectedFlightNumber', flightNumberArray[arrayInc]);
    var randomLaunch = await getSpacexData("/v3/launches/" + flightNumberArray[arrayInc]);
    console.log('shuffledResponse', shuffledLaunches);
    console.log('selectedLaunch', randomLaunch);
    
    var tenseOfLaunch;
    if (tenseID === 'past') {
      tenseOfLaunch = ' launched ';
    } else if (tenseID === 'upcoming') {
      tenseOfLaunch = ' will launch ';
    }
    
    const date = convertDateForSpeech(randomLaunch.launch_date_unix);
    
    var launchOutput = 'During mission ' + randomLaunch.mission_name + ' on ' + date +
        ' ... Space X ' + tenseOfLaunch + randomLaunch.rocket.rocket_name + ' at the ' + 
        randomLaunch.launch_site.site_name_long + '.';
        
    if (randomLaunch.details != null) {
      launchOutput +=  '... Here is some information about it ... ' + randomLaunch.details;
    }
    
    const speechOutput = launchOutput + ' ... Would you like to hear about another launch?';
    
    arrayInc++;
    
    sessionAttributes.counter = arrayInc;
    sessionAttributes.flightNumberArray = flightNumberArray;
    sessionAttributes.intentName = 'launchesIntent';
    sessionAttributes.tenseID = tenseID;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withStandardCard(randomLaunch.mission_name, speechOutput, randomLaunch.links.mission_patch_small, randomLaunch.mission_patch)
      .withShouldEndSession(false)
      .getResponse();
  },
};

function shuffleArray(array) {
    var i = array.length,
        j = 0,
        temp;
        
    while (i--) {
        j = Math.floor(Math.random() * (i+1));
        
        // Swap randomly chosen element with current element
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    
    return array;
}

function getSpacexData(inputPath) {
  var https = require('https');
  
  return new Promise((resolve, reject) => {
    var options = {
      host: 'api.spacexdata.com',
      port: 443,
      path: inputPath,
      method: 'GET',
    };
    
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';
      
      response.on('data', (chunk) => {
        returnData += chunk;
      });
      
      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });
      
      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  });
}

function convertDateForSpeech(unixDate) {
  // const year = utcDate.substring(0, 4);
  // const month = utcDate.substring(5,7);
  // const day = utcDate.substring(8,10);
  
  // const date = month + "/" + day + "/" + year;
  // return date;
  
  var event = new Date(unixDate * 1000);
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return event.toLocaleDateString('en-US', options);
}

const YesIntentHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.YesIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if (sessionAttributes.intentName === 'historicalEvent') {
            while (sessionAttributes.counter < sessionAttributes.array.length) {
              
              var eventOutput;
              if (sessionAttributes.array[sessionAttributes.counter].details.substring(0,3) === 'On ') {
                var eventOutput = sessionAttributes.array[sessionAttributes.counter].details;
              } else {
                var eventOutput = 'On ' + convertDateForSpeech(sessionAttributes.array[sessionAttributes.counter].event_date_unix) + 
                                    ' ... ' + sessionAttributes.array[sessionAttributes.counter].details;
              }
              
              const speechOutput = eventOutput + ' ... Would you like to hear another historical event?';
              sessionAttributes.counter++;
              
              return handlerInput.responseBuilder
                  .withShouldEndSession(false)
                  .speak(speechOutput)
                  .withSimpleCard(sessionAttributes.array[sessionAttributes.counter - 1].title, speechOutput)
                  .getResponse();
            }
            return handlerInput.responseBuilder
                .withShouldEndSession(true)
                .speak(`That's all the Historical Events I have for now, Goodbye!`)
                .getResponse();
        } else if (sessionAttributes.intentName === 'launchesIntent'){
          var tenseID = sessionAttributes.tenseID;
          var randomLaunch = await getSpacexData("/v3/launches/" + sessionAttributes.flightNumberArray[sessionAttributes.counter]);
          
          var tenseOfLaunch;
          if (tenseID === 'past') {
            tenseOfLaunch = ' launched ';
          } else if (tenseID === 'upcoming') {
            tenseOfLaunch = ' will launch ';
          }
    
          const date = convertDateForSpeech(randomLaunch.launch_date_unix);
          var launchOutput = 'During mission ' + randomLaunch.mission_name + ' on ' + date +
            ' ... Space X ' + tenseOfLaunch + randomLaunch.rocket.rocket_name + ' at the ' + 
            randomLaunch.launch_site.site_name_long + '.';
              
          if (randomLaunch.details != null) {
            launchOutput +=  '... Here is some information about it ... ' + randomLaunch.details;
          }
          
          const speechOutput = launchOutput + ' ... Would you like to hear about another launch?';
          
          sessionAttributes.counter++;
          
          handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
          
          return handlerInput.responseBuilder
            .speak(speechOutput)
            .withStandardCard(randomLaunch.mission_name, speechOutput, randomLaunch.links.mission_patch_small, randomLaunch.links.mission_patch)
            .withShouldEndSession(false)
            .getResponse();
        } else {
            return handlerInput.responseBuilder
                .speak('You will need to ask a question first.')
                .reprompt('Ask a question.')
                .withShouldEndSession(false)
                .getResponse();
        }
    }
};

const NoIntentHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'No problem, Goodbye!';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Space-X';
const HELP_MESSAGE = 'You can say when is the next launch, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    LatestLaunchIntentHandler,
    UpcomingLaunchIntentHandler,
    SpacexSummaryIntentHandler,
    SpacexLocationIntentHandler,
    SpacexEmployeesIntentHandler,
    SpacexRocketIntentHandler,
    LandingPadsIntentHandler,
    WhoIsIntentHandler,
    HistoricalEventIntentHandler,
    LaunchesIntentHandler,
    YesIntentHandler,
    NoIntentHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
