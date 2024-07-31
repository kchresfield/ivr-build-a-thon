# ivr-build-a-thon
Instructions for Twilio's IVR Buila-a-thon Session!


Prerequisits
Create a Google Cloud account []
  Note: The $300 credit can only be assigned to newly created accounts. Feel free to use a personal email address to sign up if your company email address is assigned to a Google Cloud account in production. We will remind everyone at the end of the event about the free trial limitations to avoid any surprise bills. To learn more, please check out these Google Cloud docs.

This guide provides instructions for creating a Dialogflow agent that allows callers to order life insurance over the phone and take payments via Twilio's Stripe integration.

Prerequisites
Before you begin, ensure you have the following:

Google Account: To access Dialogflow.
Twilio Account: For phone call integration.
Stripe Account: For payment processing.
Node.js and npm: To run the webhook server.
Step 1: Create a Dialogflow Agent
Sign in to Dialogflow: Go to Dialogflow Console and sign in with your Google account.

Create a New Agent:

Click on Create Agent.
Enter an Agent Name (e.g., "Life Insurance Order Agent").
Select your default language and time zone.
Click Create.
Define Intents: Intents are used to understand user queries and respond accordingly.

Create an intent for collecting user information (e.g., CollectUserInfo).
Create an intent for selecting insurance options (e.g., SelectInsurancePlan).
Create an intent for confirming order details (e.g., ConfirmOrder).
Create an intent for processing payment (e.g., ProcessPayment).
Entities: Define entities to capture specific data.

Create entities for capturing data such as user name, insurance type, coverage amount, etc.
Fulfillment: Enable webhook fulfillment to handle backend logic.

Go to the Fulfillment section and enable the webhook.
Enter your webhook URL (this will be configured later).
Step 2: Set Up Twilio Integration
Sign in to Twilio: Go to Twilio Console and sign in.

Purchase a Phone Number:

Go to Phone Numbers > Buy a Number.
Choose a phone number and buy it.
Set Up Twilio Function for Dialogflow Integration:

In Twilio Console, go to Functions > Create Function.

Use the Blank template.

Name your function (e.g., DialogflowIntegration).

Use the following code snippet to forward calls to Dialogflow:

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
