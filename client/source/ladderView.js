"use strict"

const React = require("react")
const MobxReact = require("mobx-react")
const MainStore = require("./mainStore.js")

require("./ladderView.less")

const ladderImage = require("./ladder.png")

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
        MainStore.scrollY -= e.nativeEvent.deltaY * 30
        MainStore.scrollY = Math.max(MainStore.scrollY, 0)
    }

    render() {
        const rungHeight = 35
        let offsetY = -MainStore.scrollY % rungHeight
        let rungNum = Math.floor(MainStore.scrollY / rungHeight)

        return (
            <div className="ladderView" ref={(element) => this.ladderViewRef = element}
                onMouseDown={(e) => this.onInputDown(e)}
                onMouseMove={(e) => this.onInputMove(e)}
                onMouseUp={(e) => this.onInputUp(e)}
                onMouseLeave={(e) => this.onInputUp(e)}
                onWheel={(e) => this.onWheel(e)} >
                <LadderRungView offsetY={offsetY} />
                <LadderRungView offsetY={rungHeight + offsetY} />
                <LadderRungView offsetY={rungHeight * 2 + offsetY} />
                <LadderRungView offsetY={rungHeight * 3 + offsetY} />
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
            </div>
        )
    }
}
