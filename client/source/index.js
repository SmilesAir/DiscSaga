"use strict"

const React = require("react")
const ReactDOM = require("react-dom")
const MobxReact = require("mobx-react")
import { FacebookProvider, LoginButton } from "react-facebook"
const LadderView = require("./ladderView.js")

require("./index.less")

@MobxReact.observer class Main extends React.Component {
    constructor() {
        super()

        getLadderMoveList().then((data) => console.log(data))
    }

    handleResponse(data) {
        console.log(data)

        this.token = data.tokenDetail.accessToken

        getUserDataFromAws()

        getChallengeAttemptsFromAws()
    }

    handleError(error) {
        this.setState({ error: error })
    }

    async testUpload() {
        let videoFile = document.getElementById("file-input").files[0]

        this.groupId = "522285991808725"
        this.formData = null
        this.uploadSessionId = null
        this.uploadUrl = `https://graph-video.facebook.com/${this.groupId}/videos`

        console.log("Start upload", videoFile.name)

        const startResp = await this.startUpload(videoFile.size)
        await this.transfer(videoFile, startResp.start_offset, startResp.end_offset)
        const finishResp = await this.finish("Test Saga Upload Video")

        console.log("Finished upload", startResp, finishResp)

        submitChallengeAttemptToAws("Gitis", startResp.video_id)
    }

    async startUpload(fileSize) {
        delete this.formData
        this.formData = new FormData()
        this.formData.append("access_token", this.token)
        this.formData.append("upload_phase", "start")
        this.formData.append("file_size", parseInt(fileSize, 10))

        const response = await this.request("post", this.uploadUrl, this.formData)
        this.uploadSessionId = response.upload_session_id

        return response
    }

    async transfer(file, startOffsetString, endOffsetString) {
        delete this.formData
        this.formData = new FormData()
        this.formData.append("access_token", this.token)
        this.formData.append("upload_phase", "transfer")
        this.formData.append("upload_session_id", this.uploadSessionId)

        const responses = []

        let startOffset = parseInt(startOffsetString, 10)
        let endOffset = parseInt(endOffsetString, 10)

        while(startOffset < endOffset) {
            const blob = file.slice(startOffset, endOffset + 1)

            this.formData.append("start_offset", startOffset)
            this.formData.append("video_file_chunk", blob)

            console.log("Transfering chunk")

            const response = await this.request("post", this.uploadUrl, this.formData)
            startOffset = parseInt(response.start_offset, 10)
            endOffset = parseInt(response.end_offset, 10)
            responses.push(response)
        }

        return responses
    }

    async finish(title) {
        delete this.formData
        this.formData = new FormData()
        this.formData.append("access_token", this.token)
        this.formData.append("upload_phase", "finish")
        this.formData.append("upload_session_id", this.uploadSessionId)
        this.formData.append("title", title)
        this.formData.append("description", "Trying out the description Ryan Young")

        const response = await this.request("post", this.uploadUrl, this.formData)

        return response
    }

    request(method, url, data) {
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
                        statusText: xhr.response.error
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

    async getSubmits() {
        let attemptsData = await getChallengeAttemptsFromAws()
        console.log("Attemp data: ", attemptsData)

        if (attemptsData.submitData.length > 0) {
            let data = attemptsData.submitData[0]
            this.challengeUserId = data.userId
            this.challengeTime = data.time
            this.challengePass = true
        }
    }

    review() {
        reviewChallengeAttemptToAws(this.challengeUserId, this.challengeTime, this.challengePass)
    }

    render() {
        return (
            <div>
                <div>
                    <FacebookProvider appId="618459952333109">
                        <LoginButton
                            scope="email, publish_to_groups, publish_pages, publish_video, manage_pages, pages_show_list"
                            onCompleted={(data) => this.handleResponse(data)}
                            onError={(error) => this.handleError(error)}
                        >
                            <span>Login to Facebook</span>
                        </LoginButton>
                    </FacebookProvider>
                    <button onClick={() => document.getElementById("file-input").click()}>Open</button>
                    <input id="file-input" type="file" name="name" style={{ display: "none" }} />
                    <button onClick={() => this.testUpload()}>
                        Test Upload
                    </button>
                    <button onClick={() => this.getSubmits()}>Get Submit List</button>
                    <button onClick={() => this.review()}>Review</button>
                </div>
                <LadderView />
            </div>
        )
    }
}

ReactDOM.render(
    <Main />,
    document.getElementById("mount")
)

function getUserDataFromAws() {
    return fetch(`https://8yifxwpw4c.execute-api.us-west-2.amazonaws.com/development/fbUserId/${FB.getUserID()}/getUserData`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        return response.json()
    }). then((data) => {
        console.log("reponse from aws", data)
    })
}

function submitChallengeAttemptToAws(challengeId, videoId) {
    return fetch(`https://8yifxwpw4c.execute-api.us-west-2.amazonaws.com/development/fbUserId/${FB.getUserID()}/challengeId/${challengeId}/videoId/${videoId}/submitChallengeAttempt`, {
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

function getChallengeAttemptsFromAws() {
    return fetch(`https://8yifxwpw4c.execute-api.us-west-2.amazonaws.com/development/fbUserId/${FB.getUserID()}/getChallengeAttempts`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        return response.json()
    }). then((data) => {
        return data
    })
}

function reviewChallengeAttemptToAws(challengeUserId, challengeTime, isPass) {
    return fetch(`https://8yifxwpw4c.execute-api.us-west-2.amazonaws.com/development/fbUserId/${FB.getUserID()}/time/${challengeTime}/challengeUserId/${challengeUserId}/isPass/${isPass}/reviewChallengeAttempt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        return response.json()
    }). then((data) => {
        console.log("review submit response from aws", data)
    })
}

function getLadderMoveList() {
    return fetch("https://spreadsheets.google.com/feeds/cells/1Dq5id1egKWG5pnGj5Dqf4lZZ53b0ndDj-DMP13ktGyQ/1/public/full?alt=json")
        .then((response) => {
            return response.json()
        }).then((data) => {
            let moveListData = {}
            let dataRowId = undefined
            let moveId = undefined
            let moveData = undefined
            let keyNames = {}
            for (let cellData of data.feed.entry) {
                let rowId = cellData.gs$cell.row
                let columnId = cellData.gs$cell.col
                let content = cellData.content.$t

                if (rowId === "1") {
                    keyNames[columnId] = content
                }else if (rowId !== dataRowId) {
                    if (moveId !== undefined) {
                        moveListData[moveId] = moveData
                    }

                    dataRowId = rowId
                    moveId = content
                    moveData = {}
                } else {
                    moveData[keyNames[columnId]] = content
                }
            }

            if (moveId !== undefined) {
                moveListData[moveId] = moveData
            }

            return moveListData
        })
}
