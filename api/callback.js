module.exports = async function handler(req, res) {
  var code = req.query.code;

  var response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  var data = await response.json();
  var token = data.access_token || '';

  var html =
    '<html><body><script>' +
    '(function() {' +
    '  function receiveMessage(e) {' +
    '    window.opener.postMessage(' +
    '      "authorization:github:success:" + JSON.stringify({token:"' + token + '",provider:"github"}),' +
    '      e.origin' +
    '    );' +
    '    window.removeEventListener("message", receiveMessage, false);' +
    '  }' +
    '  window.addEventListener("message", receiveMessage, false);' +
    '  window.opener.postMessage("authorizing:github", "*");' +
    '})();' +
    '</script></body></html>';

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
