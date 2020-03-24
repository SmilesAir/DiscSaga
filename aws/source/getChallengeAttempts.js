
const AWS = require('aws-sdk')
let docClient = new AWS.DynamoDB.DocumentClient()

const Common = require("./common.js")

module.exports.handler = (e, c, cb) => { Common.handler(e, c, cb, async (event, context) => {
    let userId = event.pathParameters.fbUserId
    if (userId === undefined || userId === "") {
        throw new Error("Invalid user id")
    }

    // Todo: Check for judge whitelist

    let submitData = undefined
    let scanParams = {
        TableName: process.env.CHALLENGE_SUBMIT_TABLE
    }
    await docClient.scan(scanParams).promise().then((data) => {
        submitData = data.Items
    })

    return {
        success: true,
        submitData: submitData
    }
})}
