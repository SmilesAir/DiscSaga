
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

    let now = Date.now()
    let submitParams = {
        TableName: process.env.CHALLENGE_SUBMIT_TABLE,
        Item: {
            time: now,
            userId: userId,
            challengeId: challengeId,
            videoId: videoId
        }
    }
    await docClient.put(submitParams).promise().then(() => {
        let getProfileParams = {
            TableName: process.env.USER_PROFILE_TABLE,
            Key: {
                userId: userId
            }
        }
        return docClient.get(getProfileParams).promise()
    }).then((profileData) => {
        if (profileData === undefined || Common.isItemEmpty(profileData)) {
            throw new Error(`Can't find profile data for ${userId}`)
        }

        profileData = profileData.Item
        profileData.pendingSubmitKeys.push(now)

        let updateProfileParams = {
            TableName: process.env.USER_PROFILE_TABLE,
            Key:{
                userId: userId
            },
            UpdateExpression: "set pendingSubmitKeys = :pendingSubmitKeys",
            ExpressionAttributeValues:{
                ":pendingSubmitKeys": profileData.pendingSubmitKeys
            },
            ReturnValues: "NONE"
        }
        return docClient.update(updateProfileParams).promise().catch((error) => {
            console.log(`Error updating pendingSubmitKeys for ${userId}. Error ${error}`)
        })
    })

    return {
        success: true
    }
})}
