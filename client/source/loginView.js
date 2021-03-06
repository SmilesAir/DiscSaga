"use strict"

const React = require("react")
const MobxReact = require("mobx-react")
const MainStore = require("./mainStore.js")
const CommonActions = require("./commonActions.js")
const FacebookProvider = require("react-facebook").FacebookProvider
const Login = require("react-facebook").Login

require("./loginView.less")

module.exports = @MobxReact.observer class LoginView extends React.Component {
    constructor() {
        super()
    }

    async onLoginResponse(data) {
        console.log("FB Logged In:", data)

        let userDataResponse = await this.getUserDataFromAws()
        MainStore.profileData = userDataResponse.profileData
        MainStore.profileChallengeData = userDataResponse.challengeData

        let submittedAttemptsResponse = await CommonActions.getChallengeAttemptsFromAws()
        MainStore.profileSubmittedAttemptsData = submittedAttemptsResponse.submitData

        MainStore.facebookProfileId = data.profile.id
        MainStore.accessToken = data.tokenDetail.accessToken
        MainStore.firstName = data.profile.first_name
        MainStore.lastName = data.profile.last_name

        console.log(MainStore.profileChallengeData)
    }

    onLoginError(error) {
        console.error("Login error:", error)
    }

    getUserDataFromAws() {
        return fetch(`https://8yifxwpw4c.execute-api.us-west-2.amazonaws.com/development/fbUserId/${FB.getUserID()}/getUserData`, {
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

    getLoginButtonText(loading, error) {
        if (loading) {
            return "Logging In..."
        } else if (error) {
            return "Error logging in"
        } else {
            return "Login to Facebook"
        }
    }

    render() {
        let loginViewClass = `loginView ${MainStore.accessToken !== undefined ? "hide" : ""}`

        return (
            <div className={loginViewClass}>
                <div className="title">
                    Disc Saga
                </div>
                <div className="message">
                    Please sign into your Facebook account
                </div>
                <FacebookProvider appId="618459952333109">
                    <Login
                        scope="email, publish_to_groups, publish_pages, publish_video, manage_pages, pages_show_list, user_videos, user_posts"
                        onCompleted={(data) => this.onLoginResponse(data)}
                        onError={(error) => this.onLoginError(error)}
                    >
                        {({ loading, handleClick, error }) =>
                            <button className="loginButton" onClick={handleClick}>
                                {this.getLoginButtonText(loading, error)}
                            </button>
                        }
                    </Login>
                </FacebookProvider>
            </div>
        )
    }
}

