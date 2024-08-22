const mysql = require("mysql2/promise");
// This is your new function. To start, set the name and path on the left.

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
