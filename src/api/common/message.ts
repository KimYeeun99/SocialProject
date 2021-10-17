var admin = require("firebase-admin");
var serviceAccount = require("../../../adminsdk.json");
import {getDevice} from './device';
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
        notification: {
            title : data.title,
            body : data.body
        },
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
            logger.info('Successfully sent message:' + response)
        })
        .catch((error) => {
            logger.error("[SendMessging]" + error);
    });
}

export {sendMessage}

