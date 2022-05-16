var express = require("express");
var fs = require("fs");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("src"));
app.use(express.static("../ASK-contract/build/contracts"));

app.get("/", function (req, res) {
  res.render("index.html");
});

app.get("/airlineFlights", function (req, res) {
  var contents = fs.readFileSync("db/ASKAvailSeats.json");
  var cursor = JSON.parse(contents);
  var airlineFlights = {};
  for (index in cursor) {
    airlineFlights[cursor[index].FlightID] = cursor[index];
  }
  res.send(airlineFlights);
});

app.post("/updateSeats", function (req, res) {
  console.log("Inside index.js. Seat value: " + req.body.seats + " flight Id: " + req.body.flightId);
  var seats = parseInt(req.body.seats);
  var flightId = parseInt(req.body.flightId);
  var contents = fs.readFileSync("./db/ASKAvailSeats.json");
  // console.log("Index.js contents: " + contents);
  var cursor = JSON.parse(contents);
  // console.log("Index.js cursor: " + cursor);
  for (index in cursor) {
    if (cursor[index].FlightID == flightId) {
      var newSeats = cursor[index].SeatsAvail - seats;
      cursor[index].SeatsAvail = newSeats;
      var data = JSON.stringify(cursor, null, 2);
      fs.writeFile("./db/ASKAvailSeats.json", data, (err) => {
        if (err) throw err;
        res.send({ updatedSeats: newSeats });
      });
    }
  }
});

app.listen(3000, function () {
  console.log("Airline Consortium ASK Dapp listening on port 3000!");
});
