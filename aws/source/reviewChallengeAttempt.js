
const AWS = require('aws-sdk')
let docClient = new AWS.DynamoDB.DocumentClient()

const Common = require("./common.js")

module.exports.handler = (e, c, cb) => { Common.handler(e, c, cb, async (event, context) => {
    let userId = event.pathParameters.fbUserId
    if (userId === undefined || userId === "") {
        throw new Error("Invalid user id")
    }

    let challengeTime = parseInt(event.pathParameters.time, 10)
    if (challengeTime === undefined || challengeTime === "") {
        throw new Error("Invalid time key")
    }

    let challengeUserId = event.pathParameters.challengeUserId
    if (challengeUserId === undefined || challengeUserId === "") {
        throw new Error("Invalid challenge user id")
    }

    let isPass = event.pathParameters.isPass
    if (isPass === undefined || isPass === "") {
        throw new Error("Invalid result")
    }

    // Todo: Check for enough energy

    let getSubmitParams = {
        TableName: process.env.CHALLENGE_SUBMIT_TABLE,
        Key: {
            time: challengeTime,
            userId: challengeUserId
        }
    }
    await docClient.get(getSubmitParams).promise().then((submitData) => {
        if (Common.isItemEmpty(submitData)) {
            throw new Error("Can't find submit data")
        } else {
            let getChallengeParams ={
                TableName: process.env.CHALLENGE_RESULTS_TABLE,
                Key: {
                    userId: challengeUserId,
                    challengeId: submitData.Item.challengeId
                }
            }
            let prevChallengeData = await docClient.get(getChallengeParams).promise().then((data) => {
                return data.Item
            }).catch((error) => {
                throw new Error(`Error getting previous challenge data for ${submitData.Item.challengeId}`)
            })

            let result = prevChallengeData && prevChallengeData.result || "none"
            if (isPass === "true") {
                if ((result === "clock" && submitData.Item.spin === "counter") ||
                    (result === "counter" && submitData.Item.spin === "clock")) {
                    result = "both"
                } else if (result === "none") {
                    result = submitData.Item.spin
                }
            }

            let putParams = {
                TableName: process.env.CHALLENGE_RESULTS_TABLE,
                Item: {
                    userId: challengeUserId,
                    challengeId: submitData.Item.challengeId,
                    result: result,
                    reviewedAt: Date.now(),
                    reviewer: userId
                }
            }
            return docClient.put(putParams).promise()
        }
    }).then(() => {
        let deleteParams = {
            TableName: process.env.CHALLENGE_SUBMIT_TABLE,
            Key: {
                time: challengeTime,
                userId: challengeUserId
            }
        }
        return docClient.delete(deleteParams).promise()
    }).then(async () => {
        let profileData = await Common.getProfileData(challengeUserId)
        let submitIndex = profileData.pendingSubmitKeys.findIndex((id) => {
            return id === challengeTime
        })
        if (submitIndex !== -1) {
            profileData.pendingSubmitKeys.splice(submitIndex, 1)

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
            return docClient.update(updateProfileParams).promise()
        } else {
            console.log("Error. Couldn't find pending challenge id in profile data.")
        }
    }).catch((error) => {
        console.log(`Error reviewing challenge for ${challengeTime}-${challengeUserId}. Error ${error}`)
    })

    return {
        success: true
    }
})}
