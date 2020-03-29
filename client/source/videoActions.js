"use strict"

const MainStore = require("./mainStore.js")

let formData = undefined
let uploadSessionId = undefined
let uploadvideoUrl = "https://graph-video.facebook.com/522285991808725/videos"

module.exports.submitChallengeAttempt = function(file, title, description, challengeId, spin) {
    startVideoUpload(file.size).then((startResp) => {
        uploadSessionId = startResp.upload_session_id

        transferVideo(file, startResp.start_offset, startResp.end_offset)

        finishVideoUpload(title, description)
        console.log("Finish Upload Response", startResp)

        if (startResp && startResp.video_id !== undefined) {
            submitChallengeAttemptToAws(challengeId, spin, startResp.video_id)
        }
    })
}

function startVideoUpload(fileSize) {
    formData = new FormData()
    formData.append("access_token", MainStore.accessToken)
    formData.append("upload_phase", "start")
    formData.append("file_size", parseInt(fileSize, 10))

    return request("post", uploadvideoUrl, formData)
}

async function transferVideo(file, startOffsetString, endOffsetString) {
    formData = new FormData()
    formData.append("access_token", MainStore.accessToken)
    formData.append("upload_phase", "transfer")
    formData.append("upload_session_id", uploadSessionId)

    const responses = []

    let startOffset = parseInt(startOffsetString, 10)
    let endOffset = parseInt(endOffsetString, 10)

    while(startOffset < endOffset) {
        const blob = file.slice(startOffset, endOffset + 1)

        formData.append("start_offset", startOffset)
        formData.append("video_file_chunk", blob)

        console.log("Transfering chunk")

        const response = await request("post", uploadvideoUrl, formData)
        startOffset = parseInt(response.start_offset, 10)
        endOffset = parseInt(response.end_offset, 10)
        responses.push(response)
    }

    return responses
}

async function finishVideoUpload(title, description) {
    formData = new FormData()
    formData.append("access_token", MainStore.accessToken)
    formData.append("upload_phase", "finish")
    formData.append("upload_session_id", uploadSessionId)
    formData.append("title", title)
    formData.append("description", description)
    formData.append("embeddable", true)

    return await request("post", uploadvideoUrl, formData)
}

function request(method, url, data) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()

        xhr.open(method, url)
        xhr.responseType = "json"
        xhr.setRequestHeader("Accept", "application/json")

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response)
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.response && xhr.response.error
                })
            }
        }
        xhr.onerror = function() {
            reject({
                status: this.status,
                statusText: xhr.statusText
            })
        }
        xhr.send(data)
    }).catch((error) => {
        console.log("promise error", error)
    })
}

function submitChallengeAttemptToAws(challengeId, spin, videoId) {
    return fetch(`https://8yifxwpw4c.execute-api.us-west-2.amazonaws.com/development/fbUserId/${MainStore.facebookProfileId}/challengeId/${challengeId}/spin/${spin}/videoId/${videoId}/submitChallengeAttempt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        return response.json()
    }). then((data) => {
        console.log("reponse from aws", data)
    })
}
