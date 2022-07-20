var express = require('express');
var app = express();
app.use(express.static('src'));
app.use(express.static('../DCC-contract/build/contracts'));
app.get('/', function (req, res) {
  res.render('index.html');
});

app.get('/dic', function (req, res) {
  res.sendFile('dic.html',{root : __dirname + '/src'});
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});