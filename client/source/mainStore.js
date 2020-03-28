"use strict"

const Mobx = require("mobx")

module.exports = Mobx.observable({
    scrollY: 0,
    currentRung: 0,
    challengeList: undefined,
    rungList: undefined,
    showChallengeView: false,
    currentChallengeId: undefined,
    accessToken: undefined
})
