App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: "http://127.0.0.1:7545",
  chairPerson: null,
  currentAccount: null,
  flightData: {},
  requests: {},

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);

    ethereum.enable();

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Airlines.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var voteArtifact = data;
      App.contracts.vote = TruffleContract(voteArtifact);
      App.contracts.mycontract = data;
      // Set the provider for our contract
      App.populateAddress();
      App.contracts.vote.setProvider(App.web3Provider);
      App.getChairperson();
      return App.populateFlightDetails();
    });
  },

  bindEvents: function () {
    $(document).on("click", "#airlineRegister", App.handleRegister);
    $(document).on("click", "#airlineUnRegister", App.handleUnregister);
    $(document).on("click", "#airlineRequest", App.handleASKrequest);
    $(document).on("click", "#airlineResponse", App.handleASKresponse);
    $(document).on("click", "#airlineSettle", App.handleSettlePayment);
    $(document).on("click", "#replenishEscrow", App.handleReplenishEscrow);
  },

  populateFlightDetails: function () {
    $.get("/airlineFlights", function (data, status) {
      if (status == "success") {
        App.flightData = data;
        for (d in data) {
          console.log(data);
          var flight = data[d];
          if (flight.SeatsAvail > 0)
            $("#flights").append(
              "<li id='flight-data-" +
              flight.FlightID +
              "'><div class='todo-content'><h4 class='todo-name'> \
                <span><strong>" +
              flight.FlightID +
              "</strong></span><span><strong>" +
              flight.Airline +
              "</strong></span> \
                <span>" +
              flight.FromCity +
              "</span><span>" +
              flight.ToCity +
              "</span>\
                <span class='depTime'>" +
              flight.DepTime +
              "</span>\
                <span class='availSeats seats" +
              flight.FlightID +
              "'>" +
              flight.SeatsAvail +
              "</span> \
                </h4>\
                </div></li>"
            );
        }
        return App.bindEvents();
      }
    });
  },

  getChairperson: function () {
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance;
      })
      .then(function (result) {
        App.chairPerson = result.constructor.currentProvider.selectedAddress.toString();
        App.currentAccount = web3.eth.coinbase;
      });
  },

  //Populate Account Addresses for reference
  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts(
      (err, accounts) => {
        $("#acc1addr").text(accounts[0]);
        $("#acc2addr").text(accounts[1]);
        $("#acc3addr").text(accounts[2]);
      }
    );
  },

  //Function to handle the registration of an airline
  //Should get a deposit amount from the airline
  handleRegister: function (event) {
    var deposit = $("#airlineRegDeposit").val();
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance.register({ value: web3.toWei(deposit, "ether") });
      })
      .then(function (result) {
        // console.log(result);
        if (result && parseInt(result.receipt.status) == 1) {
          App.showNotification("Registration successful", 4);
        } else {
          App.showNotification("Error during registration", 5);
        }
      })
      .catch(function (err) {
        // console.log(err);
        App.showNotification("Error during registration", 5);
      });
  },

  //Function to hanlde the deregistration of an airline
  //This can be done only by the chairperson
  //Should get the address of the airline to be deregistered
  handleUnregister: function (event) {
    var airlineAddress = $("#airlineUnRegAddress").val();
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance.unregister(airlineAddress);
      })
      .then(function (result) {
        console.log(result);
        if (result && parseInt(result.receipt.status) == 1) {
          App.showNotification("Unregistration Successful", 4);
        } else {
          App.showNotification("Error during unregistration", 5);
        }
      })
      .catch(function (err) {
        console.log(err);
        App.showNotification("Error during unregistration", 5);
      });
  },

  //Function to handle the ASK Request
  //Should get the request id, flight id, passenger id, number of seats needed,
  //the to airline address
  handleASKrequest: function (event) {
    var reqId = $("#askReqReqId").val();
    var flightId = $("#askReqFlightId").val();
    var psngrId = $("#askReqPsngrId").val();
    var nSeats = $("#askReqNumSeats").val();
    var toAirline = $("#askReqAddress").val();
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance.ASKrequest(reqId, flightId, nSeats, psngrId, toAirline);
      })
      .then(function (result) {
        // console.log(result);
        if (result && parseInt(result.receipt.status) == 1) {
          App.requests[reqId] = flightId;
          console.log("handleASKrequest: " + JSON.stringify(App.requests));
          App.showNotification("Request successful", 4);
        } else {
          App.showNotification("Error during request", 5);
        }
      })
      .catch(function (err) {
        console.log(err);
        App.showNotification("Error during request", 5);
      });
  },

  //Function to handle the ASK Response
  //Should get the request id, success value, from airline address
  handleASKresponse: function (event) {
    var reqId = $("#askRespReqId").val();
    var success = $("#askRespFlightId").val().toLowerCase() == "true";
    var fromAirline = $("#askRespAddress").val();
    // console.log("handleASKresponse: " + JSON.stringify(App.requests));
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance.ASKresponse(reqId, success, fromAirline);
      })
      .then(function (result) {
        // console.log(result);
        if (result && parseInt(result.receipt.status) == 1) {
          App.showNotification("Response successful", 4);
        } else {
          App.showNotification("Error during response", 5);
        }
      })
      .catch(function (err) {
        console.log(err);
        App.showNotification("Error during response", 5);
      });
  },

  //Function to handle payment settlement
  //Should get the request id, number of seats needed and to airline address
  handleSettlePayment: function (event) {
    var reqId = $("#spReqId").val();
    var nSeats = $("#spNumSeats").val();
    var toAirline = $("#spAddress").val();
    // console.log("RequestId: " + reqId + " nSeats: " + nSeats + " toAirline: " + toAirline);
    var flightId = App.requests[reqId];
    // console.log("App.requests: " + JSON.stringify(App.requests));
    // console.log("App.requests[reqId]: " + flightId);
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance.settlePayment(reqId, toAirline, nSeats);
      })
      .then(function (result) {
        // console.log(result);
        if (result && parseInt(result.receipt.status) == 1) {
          console.log(
            "Updating seats: Number of Seats booked: " +
            nSeats +
            " Flight Id: " +
            flightId
          );
          App.updateSeats(nSeats, flightId);
          App.showNotification("Settlement successful", 4);
        } else {
          App.showNotification("Error during settlement", 5);
        }
      })
      .catch(function (err) {
        console.log(err);
        App.showNotification("Error during settlement", 5);
      });
  },

  //Function to handle the replenish escrow
  //Should get the amount
  handleReplenishEscrow: function (event) {
    var amount = $("#replenishAmount").val();
    App.contracts.vote
      .deployed()
      .then(function (instance) {
        return instance.replenishEscrow({ value: web3.toWei(amount, "ether") });
      })
      .then(function (result) {
        // console.log(result);
        if (result && parseInt(result.receipt.status) == 1) {
          App.showNotification("Replenish successful", 4);
        } else {
          App.showNotification("Error during replenish", 5);
        }
      })
      .catch(function (err) {
        console.log(err);
        App.showNotification("Error during replenish", 5);
      });
  },

  //Function to update the seats for a flight in the database
  //Requires the number of seats that should be reduced and flight id
  updateSeats: function (seats, flightId) {
    $.post(
      "/updateSeats",
      {
        seats: seats,
        flightId: flightId,
      },
      function (data, status) {
        if (status == "success") {
          //Reduces the seats value in the table
          if (data.updatedSeats > 0)
            $(".seats" + String(flightId)).text(data.updatedSeats);
          else $("#flight-data-" + String(flightId)).remove();
        }
      }
    );
  },

  showNotification: function (text, type) {
    toastr.info(text, "", {
      iconClass: "toast-info notification" + String(type),
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      showDuration: "1000",
      positionClass: "toast-top-left",
      preventDuplicates: true,
      closeButton: true,
    };
  });
});
