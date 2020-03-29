
const AWS = require("aws-sdk")
let docClient = new AWS.DynamoDB.DocumentClient()
const fetch = require("node-fetch")

module.exports.handler = async function(event, context, callback, func) {
    try {
        let result = await func(event, context)

        let successResponse = {
            statusCode: 200,
            headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            },
            body: JSON.stringify(result)
        }

        callback(null, successResponse)
    } catch (error) {
        console.log(`Handler Catch: ${error}`)

        let failResponse = {
            statusCode: 500,
            headers: {
              "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
              "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            },
            body: error
        }

        callback(failResponse)
    }
}

module.exports.isItemEmpty = function(item) {
    return item === undefined || (Object.keys(item).length === 0 && item.constructor === Object)
}

module.exports.getProfileData = function(userId) {
    let getProfileParams = {
        TableName: process.env.USER_PROFILE_TABLE,
        Key: {
            userId: userId
        }
    }
    return docClient.get(getProfileParams).promise().then((data) => {
        return data.Item
    }).catch((error) => {
        console.log(`Error getting profile for ${userId}. Error ${error}`)
    })
}

module.exports.getLadderRungList = async function() {
    return await fetch("https://spreadsheets.google.com/feeds/cells/1Ib_BoyzARSZT5gEwRMcDFGMUqKZfLxu7DDsSA6OYr1g/1/public/full?alt=json")
        .then((response) => {
            return response.json()
        }).then((data) => {
            let rungListData = {}
            let dataRowId = undefined
            let rungId = undefined
            let rungData = undefined
            let keyNames = {}
            for (let cellData of data.feed.entry) {
                let rowId = cellData.gs$cell.row
                let columnId = cellData.gs$cell.col
                let content = cellData.content.$t

                if (rowId === "1") {
                    keyNames[columnId] = content
                }else if (rowId !== dataRowId) {
                    if (rungId !== undefined) {
                        rungListData[rungId] = rungData
                    }

                    dataRowId = rowId
                    rungId = content
                    rungData = {}
                } else {
                    let dataType = keyNames[columnId]
                    if (dataType.startsWith("Challenge")) {
                        rungData.challengeIds = rungData.challengeIds || []
                        rungData.challengeIds.push(content)
                    } else {
                        rungData[dataType] = content
                    }
                }
            }

            if (rungId !== undefined) {
                rungListData[rungId] = rungData
            }

            return rungListData
        })
}

module.exports.getRungNumberForChallengeId = function(challengeId) {
    let rungList = module.exports.getLadderRungList()

    for (let rungKey in rungList) {
        if (rungList[rungKey].challengeIds.findIndex((id) => {
            return id === challengeId
        }) !== -1) {
            return parseInt(rungKey, 10)
        }
    }

    return 0
}
