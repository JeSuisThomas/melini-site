module.exports = function handler(req, res) {
  var clientId = process.env.GITHUB_CLIENT_ID;
  var proto = req.headers['x-forwarded-proto'] || 'https';
  var redirectUri = proto + '://' + req.headers.host + '/api/callback';

  var authUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + clientId +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=repo,user';

  res.redirect(authUrl);
};
