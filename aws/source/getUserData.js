
const AWS = require('aws-sdk')
let docClient = new AWS.DynamoDB.DocumentClient()

const Common = require("./common.js")

module.exports.handler = (e, c, cb) => { Common.handler(e, c, cb, async (event, context) => {
    let userId = event.pathParameters.fbUserId
    if (userId === undefined || userId === "") {
        throw new Error("Invalid user id")
    }

    let ret = {}

    let getProfileParams = {
        TableName: process.env.USER_PROFILE_TABLE,
        Key: {
            userId: userId
        }
    }
    let needQueryChallengeData = false
    await docClient.get(getProfileParams).promise().then((profileData) => {
        if (Common.isItemEmpty(profileData)) {
            console.log("Creating profile for: " + userId)

            ret.profileData = {
                userId: userId,
                createdAt: Date.now(),
                lastAccessAt: Date.now()
            }

            let putProfileParams = {
                TableName: process.env.USER_PROFILE_TABLE,
                Item: ret.profileData
            }
            return docClient.put(putProfileParams).promise()
        } else {
            console.log("Found profile data: " + JSON.stringify(profileData))

            needQueryChallengeData = true
            ret.profileData = profileData
            ret.profileData.lastAccessAt = Date.now()

            let updateProfileParams = {
                TableName: process.env.USER_PROFILE_TABLE,
                Key:{
                    userId: userId
                },
                UpdateExpression: "set lastAccessAt = :lastAccessAt",
                ExpressionAttributeValues:{
                    ":lastAccessAt": ret.profileData.lastAccessAt
                },
                ReturnValues: "NONE"
            }
            return docClient.update(updateProfileParams).promise()
        }
    }).catch((error) => {
        console.log(`Error creating/updating new profile for ${userId}. Error ${error}`)
    })

    if (needQueryChallengeData) {
        let challengeData = {}
        await getChallengeData(userId, challengeData)

        ret.challengeData = challengeData
    }

    return ret
})}

function getChallengeData(userId, outData, startKey) {
    let params = {
        TableName: process.env.CHALLENGE_RESULTS_TABLE,
        KeyConditionExpression: "#userId = :userId",
        ExpressionAttributeNames:{
            "#userId": "userId"
        },
        ExpressionAttributeValues: {
            ":userId": userId
        },
        ExclusiveStartKey: startKey
    }
    return docClient.query(params).promise().then((response) => {
        for (let item of response.Items) {
            outData[item.challengeId] = item
        }

        if (response.LastEvaluatedKey !== undefined) {
            return getChallengeData(userId, outData, response.LastEvaluatedKey)
        }
    })
}