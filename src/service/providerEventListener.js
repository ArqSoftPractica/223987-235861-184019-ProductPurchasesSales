require('dotenv').config({ path: `${__dirname}/.env.${process.env.NODE_ENV}` });
const sqs = require('./sqsService')
var logger = require("../logger/systemLogger");
const ProviderRepository = require('../repositories/provider-repository');
const providerRepository = new ProviderRepository();

var queueURL = process.env.SQS_PROVIDER_QUEUE_URL;
var providerQueueServiceIsActive = {isActive: false}
var params = {
    AttributeNames: ["SentTimestamp"],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ["All"],
    QueueUrl: queueURL,
    VisibilityTimeout: 30,
    WaitTimeSeconds: 0
};

const providerEventListener = async () => {
    try {
        const sqsResponse = await sqs.receiveMessage(params).promise()
        providerQueueServiceIsActive.isActive = true;
        if (sqsResponse && sqsResponse.Messages) {
            sqsResponse.Messages.forEach(async (messageGotten) => {
                            try {
                                if (messageGotten && messageGotten != undefined) {
                                    console.log("Message Gotten", messageGotten);
                                    let message = JSON.parse(messageGotten.Body);
                                    let provider = JSON.parse(message.Message);
                                    await providerRepository.upsertProvider(provider);
        
                                    try {
                                        var deleteParams = {
                                            QueueUrl: queueURL,
                                            ReceiptHandle: messageGotten.ReceiptHandle
                                        };
                                        await sqs.deleteMessage(deleteParams).promise();
                                    } catch (err) {
                                        logger.logError('Error Deleting Message from Company QUEUE', err)
                                        providerQueueServiceIsActive.isActive = false;
                                        await new Promise(resolve => setTimeout(resolve, 300000));
                                    }
                                }
                            } catch (err) {
                                logger.logError("Error creating company In Provider Service", err);
                                providerQueueServiceIsActive.isActive = false;
                                await new Promise(resolve => setTimeout(resolve, 300000));
                            }
                        });
        }
    } catch (err) {
        logger.logError('Error Receiving Company QUEUE', err);
        providerQueueServiceIsActive.isActive = false;
        await new Promise(resolve => setTimeout(resolve, 300000));
    }
    providerEventListener();
}

module.exports = { providerEventListener, providerQueueServiceIsActive }
