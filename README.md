# ivr-build-a-thon
### Instructions for Twilio's IVR Buila-a-thon Session! This guide provides instructions for creating a Dialogflow agent that allows callers to order life insurance over the phone and take payments via Twilio's Stripe integration.

## Prerequisites


Before you begin, ensure you have the following:

- [ ] Google Account: To access Dialogflow.
   >  Note: The $300 credit can only be assigned to newly created accounts. Feel free to use a personal email address to sign up if your company email address is assigned to a Google Cloud account in production. We will remind everyone at the end of the event about the free trial limitations to avoid any surprise bills. To learn more, please check out these Google Cloud docs.
- [ ] Create a Dialogflow Agent (see below)
- [ ] [Set up Twilio's Dialogflow connector.](https://www.twilio.com/docs/voice/virtual-agent/dialogflow-cx-onboarding)
- [ ] Twilio Account: For phone call integration.
- [ ] (Optional) Stripe Account: For payment processing.


### Create a Dialogflow Agent
Go to the [Dialogflow Console](https://dialogflow.cloud.google.com/cx/projects) and sign in with your Google account.

1. Click on Create Agent.
2. Enter an Agent Name (e.g., "Plant Bot").
3. Select your default language and time zone.
4. Click Create.

## Define Intents 
Intents are used to understand user queries and respond accordingly. In the Manage tab on the left had side, select Intents and create the intents listed below. Under training phrases you will add common user statements so Dialogflow can match it to the intent.

- [ ] Create an intent for making a new order (e.g., order.new).
- [ ] Create an intent for checking order status (e.g., order.track).

## Define Entities
Define entities to capture specific data such as item type, order number, etc.
- [ ] Create an entity for handeling yes or no responses.
- [ ] Create an entity for possible order items (e.g., items).
- [ ] Create an intent for possible order items with the newly created entity. (e.g., order.new.item). Make sure to include the order items in the training phrases.


## Set up agent flow
Under the Build tab, you will see a drag and drop GUI to build out the agent flow.

- [ ] On the left hand side, under `Pages`, create 3 new pages: "track", "new", and "confirm".
- [ ] Click on `Start Page` and add a `Route`
- [ ] Under the `Intent` section select the intent made for making a new order. At the bottom of the page under `Transition`, seelct `Page` and select the page title "new".
- [ ] Create another Intent under `Route` and select the intent made for checking order status.
   > There should now be 2 boxes connected to `Start Page`, `new` and `track`.
- [ ] Select the `track` box which will be used to track an order status. Click `Edit Fulfillment` and find `Agent says`. Add the response, "Ok, let's check on your order" and save your work.
- [ ] Add a new paramater to the page. Give a display name of `order-id` and add an entity type `@sys.number-sequence` and check the box that says `Required`. Save your work.
- [ ] Back on the track page, add a new route. Scroll down and find `Webhook settings`. Enable the webhook and in the drop down, select `+ Create webhook`. The link to a webhook will be provided during the demo. However if you're working on this outside of the build-a-thon, the endpoint will look similar to this:

```
exports.handler = async function(context, event, callback) {
  // fulfillment response creator
    function fulfillmentCreator (txt, ...args){
        let a = {
            "fulfillment_response": {
             "messages": [
                    {
                        "text": {
                            "text": [txt]
                        }
                    }
                ]
            },
            "sessionInfo":{
                "parameters": {
                    
                }
            }
        }
        if (args) {
            for (let i = 0; i < args.length; i += 2) {
                a.sessionInfo.parameters[args[i]] = args[i + 1];
            }
        }
        return a;
    }

    const config = {
        host: context.host,
        port: context.port,
        user: context.user,
        database: context.databaseName,
    };

    const orderNumber = Number(event.sessionInfo.parameters["order-number"]);
        try{
            // connect
            const db = await mysql.createConnection(config);

            // Perform the query
            const [rows] = await db.execute(`SELECT * FROM orders WHERE id="${orderNumber}"`);
            await db.end(); // Close the connection
            console.log(rows);
            let order = rows[0]
            const name = order.name;
            const time = order.time;

            let txt = `Your order for a ${name} will arrive in ${time} days.`
            const jsonResp = fulfillmentCreator(txt);
            return callback(null, jsonResp);
        } catch (err){
            console.log(err)
            return callback(null, err);
        }

};
```
> After the webhook executes, the agent will respond with the generated response. NOTE: the `fulfillmentCreator` function is required.

- [ ] Add a tag of "id" to the webhook.
- [ ] After enabling and adding the webhook, scroll up to the `Condition` section and select the condition rule `Match AT LEAST ONE rule`. Under Parameter, add `$page.params.status` and under Value, add `"FINAL"`. This will automatically move the agent to the next transition.
  > OPTIONAL: You can add a transition page asking if there's anything other requests.

- [ ] Select the box "new" which will be used for making a new order. Select `Edit Fulfillment` add the text, "Okay, let's start a new order" to the section `Agent says`.
- [ ] Add a new parameter. Under `Agent responses` add the text "What would you like to order?". Scroll up to the `Entity type` and select the entity created for handeling possible order items. Give the display name the value "item" and finally, check the `Required` box. Save your work.
  > OPTIONAL: Under `Reprompt event handlers` for the event `No-match default`, add a agenet response that says, "Sorry I didn't get that. What item would you like to order".

- [ ] Create a new route. Under `Agent says` add the text, "You have selected a $session.params.*item-parameter-name*, one moment please while we gather the information about your order".
- [ ] Next create a new webhook to handle the order. The link to a webhook will be provided during the demo. However if you're working on this outside of the build-a-thon, the endpoint will look similar to this:

 ```
exports.handler = async function(context, event, callback) {

  function fulfillmentCreator (txt, ...args){
    let a = {
        "fulfillment_response": {
            "messages": [
                {
                    "text": {
                        "text": [txt]
                    }
                }
            ]
        },
        "sessionInfo":{
            "parameters": {
                
            }
        }
    }
    if (args) {
        for (let i = 0; i < args.length; i += 2) {
          a.sessionInfo.parameters[args[i]] = args[i + 1];
        }
      }
    return a;
}

    const config = {
        host: context.host,
        port: context.port,
        user: context.user,
        database: context.databaseName,
    };
  

    let orderName = `"${event.sessionInfo.parameters.item}"`;
    let shippingTime = Math.floor(Math.random() * 365);
    let price = 5;

    const sql2 = `INSERT INTO orders (name, price, time) VALUES (${orderName}, ${price}, ${shippingTime})` //, customer ${phoneNumber}
    
    try{
        const db = await mysql.createConnection(config);

        const [confirmation] = await db.execute(sql2);
        await db.end(); // Close the connection
        console.log(confirmation);
      
        let txt = `Your order for a ${orderName} will arrive in ${shippingTime} days. Your confirmation number is ${confirmation.insertId}.`
        const jsonResp = fulfillmentCreator(txt, "order-id", confirmation.insertId, price);

        return callback(null, jsonResp);
    } catch (err){
        console.log(err)
        return callback(null, err);
    } 

}
```
Add a tag of "order" to the webhook settings.

- [ ] Back in the Dialogflow console for the `new` page's route, add a new condition. Select the condition rule `Match AT LEAST ONE rule` and add the parameter `$page.params.status` with the value `"FINAL"`. This will conclude the flow.
  > OPTIONAL: You can add a transition page asking if there's anything other requests.
- [ ] Scroll down to `Transition` and select the "confirm" page that was created earlier. Save your work.
   > There should now be a "confirm" box attached to the "new" box.
- [ ] Select the "confirm" box and edit the fulfillment. Under `Agent responses`, add the response, "Would you like to continue and place the order?". Save your work.
- [ ] Create a new parameter, and select the entity type "yes-or-no" that was created earlier.
- [ ] Next two routes will be created to handle the yes or no response from the customer.
      - In the first route, under `Condition rules` select the option `Match AT LEAST ONE rule` and for the parameter, enter the value "$session.params.<parameter-name>" with a value of no. Under `Agent responses` add a value of "Not a problem! Transferring you back to the main menu", and under `Transition`, select `Start Page`.
      - For the second route, under `Condition rules` select the option `Match AT LEAST ONE rule` and for the parameter, enter the value "$session.params.<parameter-name>" with a value of yes. Under `Agent responses` add a value of "Transferring you to payment", and under `Transition`, select `End Session`.

## Set Up Twilio Integration for Dialogflow
If you haven't done so already, head over to the Integration section under the Manage tab. Under "One-click Telephony", connect Twilio. *You must be signed in the the Twilio console to complete this action*

Once there, add a friendly-name for your new flow. Once completed, a new Studio flow will be created for the agent.

Head over to the newly created Studio flow and complete the following steps:

- [ ] Under the `Incoming Call` flow, add a `Say/Play` widget and add the text "Hello, this call will be recorded for quality assurance".
- [ ] Connect the Say/Play widget to a `Call Recording` widget and turn on call recording.
- [ ] Connect the recording widget to the `Connect Virtual Agent` widget. Under the parameter section, add an additional parameter called `caller` with the value `{{trigger.call.From}}`. This will allow Dialogflow to have access to the user's caller ID.
- [ ] Under the Flow Control section, add a `Set Variable` widget to capture the price of the item that was purchased. Under the key, set a value of "price" and a value of `{{widgets.<virtual-agent-widget-name>.VirtualAgentProviderData.sessionInfo.parameters.price}} || null`.
- [ ] Add another variable with a key name of "item", and tha value of `{{widgets.<virtual-agent-widget-name>.VirtualAgentProviderData.sessionInfo.parameters.item}}`.
- [ ] Add a `Split Based On` widget and check if there is a value for the price variable that was defined.
- [ ] Connect the split widget to a `Capture Payments` widget and enter the optional Stripe pay connector information. This will be built in the next section.

## Set up Voice Intelligence (Optional)
Voice Intelligence is one of Twilio's newest features that transcribes voice calls and highlights actions and words mentioned in a call using AI. Voice Intelligence can also summerize and measure call satisfaction.

In the Twilio console, head over to the Voice Intelligence section and create a new service.
- [ ] Create and name a new service and select the settings necessary for your use case. For now, do not select PII redaction.
- [ ] In the newly created service, create 2 new operators. One called `plants` and one called `competitors`.
- [ ] For the `plants` operator, create a new phrase set with the label `ficus`. For the phrase match, select `Exact match` and add the values: `rubber fig`, `fiddle-leaf`, `fig`, and `banyan`. Create another phrase set titled, `pothos`, then add the values: `golden`, `jade`, and `marble queen` with exact matching for each.
- [ ] For the `competitors` operator, create a new phrase set with the label `large corporation`. For the phrase match, select `Exact match` and add the values: `House Depot`, `Windowmart`, and `Highs`.
- [ ] Add each of these newly created operators to the newly created service. Each operator has a "Try it out" feature where previously recorded conversations can be tested for the inclusion of each operator's phrases/words.



## Set up Stripe Integration (Optional)
If you haven't done so already, [create a Stripe account](https://dashboard.stripe.com/register).

- [ ] Integrate the Stripe Pay Connector in the Twilio console. Under Voice > Manage > Pay Connectors, select Stripe Connector. Install and look over the terms and conditions and confirm if you agree with the t&c.
- [ ] Create a Twilio function to handle the payment results. Head to Functions and Assets > Services and create a new service with the name `process-payment`. Add a new endpoint named `process`. Next to the endpoint name, open the visibility to the public then add this code to your function:
```
exports.handler = function(context, event, callback) {
    console.log("in Pay");
    console.log(event);
    console.log(event.Result);

    let twiml = new Twilio.twiml.VoiceResponse();

    switch (event.Result) {
    case "success":
        text = "Thank you for your payment";
        break;
    case "payment-connector-error":
        text = "The Payment Gateway is reporting an error";
        console.log(decodeURIComponent(event.PaymentError));
        break;

    default: 
        text = "The payment was not completed successfully";
}
    twiml.say(text);
    callback(null, twiml);
};
```
then save and deploy the function.

- [ ] Create a new [TwiML Bin](https://www.twilio.com/console/runtime/twiml-bins) to handle the payment. The caller will hear prompts to enter their payment information. Add the following code and add the link from the twilio function that was just created to the `action` attribute:
```
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Calling Twilio Pay</Say>
  <Pay paymentConnector="Default" action=<link-to-twilio-payment-function> chargeAmount="{{Body}}"/>
</Response>
```
to learn more about the Pay verb and optional attributes, check out the Twilio documentation [here](https://www.twilio.com/docs/voice/twiml/pay).


- [ ] Head back to the Studio Flow and enter the information from the newly created Stripe Connector.
   - Select the acceptable card types
   - Configure the postal and security code options
   - Add the **unique name** of the payment gateway connector that was created
   - For the carge amount, add the value {{flow.variables.price}}
   - Select the currency to charge the payments

- [ ] Connect the Success flow to a `Say/Play` widget that says, "Thank you for your payment of {{flow.variables.price}} for your {{flow.variables.item}} have a great day!"
- [ ] Connect the error messages to a `Gather Input on Call` widget that says, "Sorry, there was an error processing your order, would you like me to connect you to an agent?", and add any logic thereafter.


