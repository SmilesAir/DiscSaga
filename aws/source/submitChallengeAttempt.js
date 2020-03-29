
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

    let spin = event.pathParameters.spin
    if (spin === undefined || spin === "") {
        throw new Error("Invalid spin")
    }

    let profileData = await Common.getProfileData(userId)
    if (profileData === undefined || Common.isItemEmpty(profileData)) {
        throw new Error(`Can't find profile data for ${userId}`)
    }

    console.log(profileData)

    // Todo: Check for enough energy

    let rungNumber = Common.getRungNumberForChallengeId(challengeId)
    if (rungNumber > profileData.currentRung + 5) {
        throw new Error(`Trying to submit challenge more than 5 rungs ahead. At: ${profileData.currentRung}, submitted: ${rungNumber}`)
    }

    let now = Date.now()
    let submitParams = {
        TableName: process.env.CHALLENGE_SUBMIT_TABLE,
        Item: {
            time: now,
            userId: userId,
            challengeId: challengeId,
            videoId: videoId,
            spin: spin
        }
    }
    await docClient.put(submitParams).promise().then(() => {
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
