function clientHasJavaScriptEnabled(req) {
    return req.headers["content-type"] !== "application/x-www-form-urlencoded";
}
module.exports = clientHasJavaScriptEnabled;