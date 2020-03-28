

module.exports.getChallengeAttemptsFromAws = function() {
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
