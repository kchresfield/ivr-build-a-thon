const mysql = require("mysql2/promise");

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
