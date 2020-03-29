"use strict"

const Mobx = require("mobx")

module.exports = Mobx.observable({
    scrollY: 0,
    challengeList: undefined,
    rungList: undefined,
    showChallengeView: false,
    currentViewChallengeId: undefined,
    accessToken: undefined,
    profileData: undefined,
    profileChallengeData: undefined,
    profileSubmittedAttemptsData: undefined,
    facebookProfileId: undefined,
    firstName: undefined,
    lastName: undefined
})
