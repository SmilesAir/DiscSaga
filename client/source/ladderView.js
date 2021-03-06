"use strict"

const React = require("react")
const MobxReact = require("mobx-react")
const MainStore = require("./mainStore.js")
const VideoActions = require("./videoActions.js")

require("./ladderView.less")

const ladderImage = require("./ladder.png")
const markerImage = require("./marker.png")


const rungHeight = 35

module.exports = @MobxReact.observer class LadderView extends React.Component {
    constructor() {
        super()

        this.isScrolling = false
    }

    onInputDown(e) {
        //console.log("down", e)

        if (!this.isScrolling) {
            this.isScrolling = true

            this.lastY = e.clientY
        }
    }

    onInputMove(e) {
        if (this.isScrolling) {
            //console.log("move", e)

            MainStore.scrollY += (e.clientY - this.lastY) / this.ladderViewRef.clientHeight * 100
            MainStore.scrollY = Math.max(MainStore.scrollY, 0)
            this.lastY = e.clientY
        }
    }

    onInputUp() {
        //console.log("up", e)

        this.isScrolling = false
    }

    onWheel(e) {
        MainStore.scrollY -= e.nativeEvent.deltaY / 10
        MainStore.scrollY = Math.max(MainStore.scrollY, 0)
    }

    render() {
        let offsetY = -MainStore.scrollY % rungHeight
        let rungNum = Math.floor(MainStore.scrollY / rungHeight)

        return (
            <div className="ladderView" ref={(element) => this.ladderViewRef = element}
                onMouseDown={(e) => this.onInputDown(e)}
                onMouseMove={(e) => this.onInputMove(e)}
                onMouseUp={(e) => this.onInputUp(e)}
                onMouseLeave={(e) => this.onInputUp(e)}
                onWheel={(e) => this.onWheel(e)} >
                <div className="ladderScroll">
                    <LadderRungView offsetY={offsetY} rungNumber={rungNum} />
                    <LadderRungView offsetY={rungHeight + offsetY} rungNumber={rungNum + 1} />
                    <LadderRungView offsetY={rungHeight * 2 + offsetY} rungNumber={rungNum + 2} />
                    <LadderRungView offsetY={rungHeight * 3 + offsetY} rungNumber={rungNum + 3} />
                </div>
                <RungDescriptionView offsetY={offsetY} rungNumber={rungNum} />
                <RungDescriptionView offsetY={rungHeight + offsetY} rungNumber={rungNum + 1} />
                <RungDescriptionView offsetY={rungHeight * 2 + offsetY} rungNumber={rungNum + 2} />
                <RungDescriptionView offsetY={rungHeight * 3 + offsetY} rungNumber={rungNum + 3} />
                <MarkerView />
                <ChallengeView />
            </div>
        )
    }
}

@MobxReact.observer class LadderRungView extends React.Component {
    constructor() {
        super()
    }

    render() {
        let rungStyle = {
            bottom: `${this.props.offsetY}%`
        }

        return (
            <div className="ladderRungView noselect" style={rungStyle}>
                <img className="rungImage" src={ladderImage} alt="Click and drag to scroll" draggable="false"/>
                <ChallengeListView rungNumber={this.props.rungNumber} />
            </div>
        )
    }
}

@MobxReact.observer class ChallengeListView extends React.Component {
    constructor() {
        super()
    }

    showChallenge(rungNumber, challengeId) {
        MainStore.showChallengeView = true
        MainStore.currentViewChallengeId = challengeId
        MainStore.currentViewRungNumber = rungNumber
    }

    render() {
        let challengeElements = []
        if (MainStore.rungList !== undefined && MainStore.challengeList !== undefined) {
            let rungData = MainStore.rungList[this.props.rungNumber]
            if (rungData !== undefined && rungData.challengeIds !== undefined) {
                for (let challengeId of rungData.challengeIds) {
                    let challengeData = MainStore.challengeList[challengeId]
                    let result = getChallengeResult(challengeId)
                    let buttonClassName = `challengeButton ${result}`
                    challengeElements.push(
                        <button key={challengeId} className={buttonClassName} onClick={() => this.showChallenge(this.props.rungNumber, challengeId)} disabled={MainStore.profileData === undefined || this.props.rungNumber > MainStore.profileData.currentRung + 4}>
                            {challengeData.Name}
                        </button>
                    )

                    if (challengeId !== rungData.challengeIds[rungData.challengeIds.length - 1]) {
                        challengeElements.push(
                            <div key={challengeId + rungData.Operator} className="operator">
                                {rungData.Operator === "AND" ? "and" : "or"}
                            </div>
                        )
                    }
                }
            }
        }

        //console.log(challengeElements)
        return (
            <div className="challengeListView">
                {challengeElements}
            </div>
        )
    }
}

@MobxReact.observer class RungDescriptionView extends React.Component {
    constructor() {
        super()
    }

    getName() {
        if (MainStore.rungList === undefined) {
            return ""
        }

        let rungData = MainStore.rungList[this.props.rungNumber - 1]
        if (rungData === undefined) {
            return ""
        }

        return rungData.Name
    }

    render() {
        let style = {
            bottom: `${this.props.offsetY}%`
        }

        return (
            <div className="rungDescription" style={style}>
                {this.getName()}
            </div>
        )
    }
}

@MobxReact.observer class MarkerView extends React.Component {
    constructor() {
        super()
    }

    render() {
        let style = {
            bottom: `${-MainStore.scrollY + 21 + window.innerHeight / 200 + rungHeight * (MainStore.profileData && MainStore.profileData.currentRung || 0)}%`
        }

        return (
            <div className="markerView" style={style}>
                <img className="markerImage" src={markerImage} alt="You are here" draggable="false"/>
            </div>
        )
    }
}

@MobxReact.observer class ChallengeView extends React.Component {
    constructor() {
        super()
    }

    onCancel() {
        MainStore.showChallengeView = false
        MainStore.currentViewChallengeId = undefined
    }

    onVideoInputChange() {
        let videoFile = document.getElementById("video-file-input").files[0]

        VideoActions.submitChallengeAttempt(videoFile,
            MainStore.challengeList[MainStore.currentViewChallengeId].Name,
            MainStore.challengeList[MainStore.currentViewChallengeId].Description,
            MainStore.currentViewChallengeId,
            this.submitSpin
        )
    }

    onSubmit(spin) {
        this.submitSpin = spin

        document.getElementById("video-file-input").click()
    }

    render() {
        if (MainStore.showChallengeView !== true || MainStore.challengeList === undefined || MainStore.currentViewChallengeId === undefined) {
            return null
        }

        let videoId = "598890723933"
        //let videoId = "598891332713" // not working
        //let userId = FB.getUserID()
        let userId = "598705540043"

        let result = getChallengeResult(MainStore.currentViewChallengeId)
        let completeClock = result === "both" || result === "clock"
        let completeCounter = result === "both" || result === "counter"

        return (
            <div className="challengeView">
                <input id="video-file-input" type="file" name="name" style={{ display: "none" }} onChange={() => this.onVideoInputChange()} />
                <div className="info">
                    <div className="title">
                        {MainStore.challengeList[MainStore.currentViewChallengeId].Name}
                    </div>
                    <div className="description">
                        {MainStore.challengeList[MainStore.currentViewChallengeId].Description}
                    </div>
                    <div className="example">
                        <iframe referrerPolicy="unsafe-url" src={`https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2F${userId}%2Fvideos%2F${videoId}%2F&width=500&show_text=false&appId=141320579359343&height=280`}
                            className="video" scrolling="no" frameBorder="0" allowtransparency="true" allow="encrypted-media" allowFullScreen={true} />
                    </div>
                </div>
                <div className="buttons">
                    <div className="submitButtonContainer">
                        <button className="submitButton" onClick={() => this.onSubmit("clock")} disabled={completeClock}>Clock</button>
                        <button className="submitButton" onClick={() => this.onSubmit("counter")} disabled={completeCounter}>Counter</button>
                    </div>
                    <button className="cancelButton" onClick={() => this.onCancel()}>Go Back</button>
                </div>
            </div>
        )
    }
}

function getChallengeResult(challengeId) {
    if (MainStore.profileChallengeData === undefined) {
        return false
    }

    let challengeData = MainStore.profileChallengeData[challengeId]

    return challengeData !== undefined && challengeData.result || "none"
}
