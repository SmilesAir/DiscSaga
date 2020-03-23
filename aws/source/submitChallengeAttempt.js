
const AWS = require('aws-sdk')
let docClient = new AWS.DynamoDB.DocumentClient()

const Common = require("./common.js")

module.exports.handler = (e, c, cb) => { Common.handler(e, c, cb, async (event, context) => {
    let userId = event.pathParameters.fbUserId
    if (userId === undefined || userId === "") {
        throw new Error("Invalid user id")
    }

    let videoId = event.pathParameters.videoId
    if (videoId === undefined || videoId === "") {
        throw new Error("Invalid video id")
    }

    let challengeId = event.pathParameters.challengeId
    if (challengeId === undefined || challengeId === "") {
        throw new Error("Invalid challenge id")
    }

    // Todo: Check for enough energy

    let submitParams = {
        TableName: process.env.CHALLENGE_SUBMIT_TABLE,
        Item: {
            userId: userId,
            challengeId: challengeId,
            videoId: videoId,
            submittedAt: Date.now()
        }
    }
    await docClient.put(submitParams).promise()

    return {
        success: true
    }
})}
