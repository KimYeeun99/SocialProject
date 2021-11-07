var admin = require("firebase-admin");
var serviceAccount = require("../../../adminsdk.json");
import {getDevice, getAllDevice} from './device';
import {logger} from "../../log/logger";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function sendMessage(userId: string, data: any) {
    // This registration token comes from the client FCM SDKs.
    const registrationToken = await getDevice(userId);

    if(!registrationToken){
        return;
    }

    const message = {
        data : {
            board_id : data.board_id,
            title : data.title,
            body : data.body
        },
        token: registrationToken
    };

    // Send a message to the device corresponding to the provided
    // registration token.
    await admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            logger.info('[SendMessaging] Successfully sent message')
        })
        .catch((error) => {
            logger.error("[SendMessging]" + error);
    });
}

async function sendAllMessage(data : any) {
    const registrationTokens = await getAllDevice();

    if(registrationTokens.length == 0){
        return;
    }

    const message = {
        data : {
            board_id : data.board_id,
            title : data.title,
            body : data.body
        },
        tokens: registrationTokens
    };
    
    await admin.messaging().sendMulticast(message)
        .then((response) => {
            logger.info('[SendAllMessaging] Successfully sent message');
        })
        .catch((error) => {
            logger.error("[SendAllMessging]" + error);
    });
}

export {sendMessage, sendAllMessage}

