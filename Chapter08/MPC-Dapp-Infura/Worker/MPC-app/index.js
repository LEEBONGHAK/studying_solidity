var express = require('express');
var app = express();
app.use(express.static('src'));
app.get('/', function (req, res) {
  res.render('index.html');
});
app.listen(3010, function () {
  console.log('MPC Dapp listening on port 3010!');
});