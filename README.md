# ivr-build-a-thon
### Instructions for Twilio's IVR Buila-a-thon Session! This guide provides instructions for creating a Dialogflow agent that allows callers to order life insurance over the phone and take payments via Twilio's Stripe integration.

## Prerequisits

Before you begin, ensure you have the following:

- [ ] Google Account: To access Dialogflow.
   >  Note: The $300 credit can only be assigned to newly created accounts. Feel free to use a personal email address to sign up if your company email address is assigned to a Google Cloud account in production. We will remind everyone at the end of the event about the free trial limitations to avoid any surprise bills. To learn more, please check out these Google Cloud docs.

- [ ] Twilio Account: For phone call integration.
- [ ] Stripe Account: For payment processing.
- [ ] Node.js and npm: To run the webhook server if not using Twilio functions.


## Create a Dialogflow Agent
Go to the [Dialogflow Console](https://dialogflow.cloud.google.com/cx/projects) and sign in with your Google account.

1. Click on Create Agent.
2. Enter an Agent Name (e.g., "Plant Order Agent").
3. Select your default language and time zone.
4. Click Create.

## Define Intents 
Intents are used to understand user queries and respond accordingly. Under training phrases you will add common user statements so Dialogflow can match it to the intent.

- [ ] Create an intent for making a new order (e.g., order.new).
- [ ] Create an intent for possible order items (e.g., order.new.item).
- [ ] Create an intent for collecting user information (e.g., user.info).
- [ ] Create an intent for processing payment (e.g., payment.new).
- [ ] Create an intent for checking order status (e.g., order.track).

## Define Entities
Define entities to capture specific data such as item type, order number, etc.
- [ ] Create an entity for possible order items (e.g., items).

## Define webhooks
Define the webhooks to handle backend logic. This will be configured later.


## Set up agent flow
Under the Build tab, you will see a drag and drop GUI to build out the agent flow.
- [ ] Click on `Start Page` and add a `Route`
- [ ] Under the `Intent` section select the intent made for making a new order. Create another Intent under `Route` and select the intent made for checking order status. You should not see 2 new boxes under the `Start Page` box.
- [ ] Select the intent for checking an order status. Inside `Entry Fulfillment` under `Agent says` add the response, "Ok, let's check on your order". Save your work.
- [ ] Add a new paramater. Give a display name of `order-id` and add an entity type `@sys.number-sequence` and check the box that says `Required`.
- [ ] Add a new route. Scroll down and find `Webhook settings`. In the drop down, select `+ Create webhook`. The link to a webhook will be provided during the demo. However if you're working on this outside of the build-a-thon, the endpoint will look similar to this:

```
// fulfillment response creator
function fulfillmentCreator (txt, paramKey = null, paramVal = null){
    let resp = {
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
    return resp;
}

app.post('/check-order-confirmation', async (req, res) => {
    let orderNumber = Number(req.body.sessionInfo.parameters["order-id"]); // Or the name given to the order parameter
    let sql = `SELECT * FROM <database-table> WHERE id=${orderNumber}`;

        try{
            let order = await queryData(sql);
            let txt = `Your order for a ${order[0].name} will arrive in ${order[0]['time']} days.` // Assuming the data entry contains the name and shipping speed of the item
            const jsonResp = fulfillmentCreator(txt);
            res.send(jsonResp);
        } catch (err){
            console.log(err)
        }
})
```
> After the webhook executes, the agent will respond with the generated response. NOTE: the `fulfillmentCreator` function is required.

- [ ] After enabling and adding the webhook, scroll up to the `Condition` section and select the condition rule `Match AT LEAST ONE rule`. Under Parameter, add `$page.params.status` and under Value, add `"FINAL"`. This will automatically move the agent to the next transition.
  > OPTIONAL: You can add a transition page asking if there's anything other requests.

- [ ] Select the box for making a new order. Under `Entry fulfillment` add the text, "Okay, let's start a new order". Add a new parameter. Under `Agent responses` add the text "What would you like to order?". Scroll up to the `Entity type` and seelct the entity created for handeling possible order items. Finally, check the `Required` box.
  > OPTIONAL: Under `Reprompt event handlers` for the event `No-match default`, add a agenet response that says, "Sorry I didn't get that. What item would you like to order".

- [ ] Create a new route. Under `Agent says` add the text, "You have selected a $session.params.<item-parameter-name>", to confirm the order. Next create a new webhook to handle the order. The link to a webhook will be provided during the demo. However if you're working on this outside of the build-a-thon, the endpoint will look similar to this:

 ```
app.post('/make-order', async (req, res) => {

    let orderName = `"${req.body.sessionInfo.parameters.item}"`; // Or the name given to the item parameter
    let shippingTime = Math.floor(Math.random() * 365);
    let phoneNumber = req.body.sessionInfo.parameters.caller.slice(2) || process.env.PHONE_NUMBER; // the phone number is a parameter sent from Twilio
    let price = Math.floor(Math.random() * 50);

    const sql = `UPDATE <database-table>.stock SET stock = stock - 1 WHERE name = ${orderName} AND stock > 0`;
    const sql2 = `INSERT INTO <database-table>.orders (name, price, time, customer) VALUES (${orderName}, ${price}, ${shippingTime}, ${phoneNumber})`
    
    try{
        let order = await queryData(sql);
        let confirmation = await queryData(sql2);
        
        let txt = `Your order for a ${orderName} will arrive in ${shippingTime} days. Your confirmation number is ${confirmation.insertId}`
        const jsonResp = fulfillmentCreator(txt, "order-id", confirmation.insertId); // utalizing the fulfillmentCreator function from the previous code sample
        res.send(jsonResp);
    } catch (err){
        console.log(err)
    }
})
```
Back in the Dialogflow console for the new order, add a new condition. Select the condition rule `Match AT LEAST ONE rule` and add the parameter `$page.params.status` with the value `"FINAL"`. This will conclude the flow.
  > OPTIONAL: You can add a transition page asking if there's anything other requests.


## Set Up Twilio Integration for Dialogflow
If you haven't done so already, head over to the Integration section under the Manage tab. Under "One-click Telephony", connect Twilio. *You must be signed in the the Twilio console to complete this action*

Once there, add a friendly-name for your new flow. Once completed, a new Studio flow will be created for the agent.

Head over to the newly created Studio flow and complete the following steps:

- [ ] Under the `Incoming Call` flow, add a `Say/Play` widget and add the text "Hello, this call will be recorded for quality assurance".
- [ ] Connect the Say/Play widget to a `Call Recording` widget and turn on call recording.
- [ ] Connect the recording widget to the `Connect Virtual Agent` widget. Under the parameter section, add an additional parameter called `caller` with the value `{{trigger.call.From}}`. This will allow Dialogflow to have access to the user's caller ID.


## Set Up Stripe Integration
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





------------- UNFINISHED CODE FOR USERS WHO DON'T WANT TO USE TWILIO FUNCTIONS ----------------
javascript
Copy code
exports.handler = function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const dialogflowEndpoint = 'YOUR_DIALOGFLOW_WEBHOOK_URL';
  
  twiml.redirect(dialogflowEndpoint);
  callback(null, twiml);
};
Configure Twilio Webhook:

Go to Phone Numbers > Manage Numbers.
Select your purchased number.
Set the Voice & Fax > A CALL COMES IN webhook to your Twilio Function URL.
Step 3: Integrate Stripe for Payment Processing
Sign in to Stripe: Go to Stripe Dashboard and sign in.

Create a Payment Intent:

Go to Developers > API Keys and note your Secret Key.
Use the secret key in your server-side code to create a payment intent.
Set Up Webhook Server:

Create a Node.js server to handle payment processing:

javascript
Copy code
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY');

const app = express();
app.use(bodyParser.json());

app.post('/payment', async (req, res) => {
  const { amount, currency } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    res.status(200).send(paymentIntent.client_secret);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
Connect Webhook to Dialogflow:

In Dialogflow, set up fulfillment to connect to your webhook server for the ProcessPayment intent.
Use the client_secret from Stripe to confirm the payment on the client side.
Step 4: Test the System
Test Dialogflow: Use the Dialogflow console to test your agent and ensure it can handle user queries correctly.

Test Twilio Call: Call your Twilio number and verify that the call is redirected to Dialogflow.

Test Payment: Walk through the ordering process and ensure payment is processed via Stripe.
