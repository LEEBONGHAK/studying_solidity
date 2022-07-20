var express = require('express');
var app = express();

app.use(express.static('src'));
app.use(express.static('../auction-contract/build/contracts'));

app.get('/', function (req, res) {
  res.render('index1.html');
});

app.listen(3000, function () {
  console.log('Auction Dapp listening on port 3000!');
});