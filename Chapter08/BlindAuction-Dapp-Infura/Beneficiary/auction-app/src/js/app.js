App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: '',
    chairPerson:null,
    currentAccount:null,
    biddingPhases: {
        "AuctionInit": "0",
        "BiddingStarted": "1",
        "RevealStarted": "2",
        "AuctionEnded": "3",
    },
    auctionPhases: {
        "0": "Bidding Not Started",
        "1": "Bidding Started",
        "2": "Reveal Started",
        "3":"Auction Ended"
    },

    init: function() {
      return App.initWeb3();
    },
  
    initWeb3: function() {
          // Is there is an injected web3 instance?
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
        // If no injected web3 instance is detected, fallback to the TestRPC
        App.web3Provider = new Web3.providers.HttpProvider(App.url);
      }
      web3 = new Web3(App.web3Provider);  
      ethereum.enable();
      return App.initContract();
    },
  
    initContract: function() {
        $.getJSON('BlindAuction.json', function(data) {
            var blindAuctionArtifact = data;
            App.contracts.BlindAuction = TruffleContract(blindAuctionArtifact);
            App.contracts.BlindAuction.setProvider(App.web3Provider);
            App.currentAccount = web3.eth.coinbase; // get current account
            jQuery('#current_account').text(web3.eth.coinbase);
            jQuery('#contractAddress').text(data.networks[3].address);
            web3.eth.getBalance(web3.eth.coinbase,(b,r)=>{
              jQuery('#balance').text(web3.fromWei(parseInt(r)));
            })
            
            App.getCurrentPhase();  //get current phase
            App.getChairperson();   // get the chairperson

            return App.bindEvents();
        });
    },
  
    bindEvents: function() {
        // $(document).on('click', '#submit-bid', App.handleBid);
        $(document).on('click', '#change-phase', App.handlePhase);
        $(document).on('click', '#generate-winner', App.handleWinner);
        $(document).on('click', '#close-auction', App.handleClose); 
    },
    getCurrentPhase : function(){
      App.contracts.BlindAuction.deployed().then(function(instance) {
        return instance.currentPhase();
      }).then(function(result) {
          App.currentPhase=result.c[0];
          var notificationText = App.auctionPhases[App.currentPhase];
          $('#phase-notification-text').text(notificationText);
      })
    },
  
    getChairperson : function(){
      App.contracts.BlindAuction.deployed().then(function(instance) {      
        return instance.beneficiary();
      }).then(function(result) {
        App.chairPerson = result;
      });
    },
    
    handlePhase: function(event){
      if(App.currentPhase=="3"){
        toastr["error"]("Auction ended");
      }else{
      App.contracts.BlindAuction.deployed().then(function(instance){
        return instance.advancePhase();
      })
      .then(function(result){
        if(result){
            if(parseInt(result.receipt.status) == 1){
                if(result.logs.length > 0){
                  App.showNotification(result.logs[0].event);
                }
                else{
                  App.showNotification("AuctionEnded");
                }
                return;
            }
            else{
                toastr["error"]("Error in changing to next Event");
            }
        } 
        else {
            toastr["error"]("Error in changing to next Event");
        }
      })
      .catch(function(err){
        if(err.message.indexOf('onlyBeneficiary')){
          toastr["error"]("Error: Only beneficiary can change the phase.");
        }
        else{
            toastr["error"]("Error in changing to next Event!");
          }
        
      });
    }
  },
  handleClose:function(){
    if(App.currentPhase=='3'){
    App.contracts.BlindAuction.deployed().then(function(instance){
      return instance.closeAuction();
    })
  }else{
    toastr["error"]("Not in a valid phase to close the auction!");
  }
  },
     
    handleWinner : function() {
      var bidInstance;
      App.contracts.BlindAuction.deployed().then(function(instance) {
        bidInstance = instance;
        return bidInstance.auctionEnd();
      }).then(function(res){
        var winner = res.logs[0].args.winner;
        var highestBid = web3.fromWei(res.logs[0].args.highestBid.toNumber());
        var text="<br><br><b>Winner: </b>"+winner+"<br><br><b>Highest Bid: </b>"+highestBid+" ETH";
        $('#winner').html(text);
        web3.eth.getBalance(web3.eth.coinbase,(b,r)=>{
          jQuery('#balance').text(parseInt(r));
        })
        toastr.info("Highest bid is " + highestBid + " ETH <br>" + "Winner is " + winner, "", {"iconClass": 'toast-info notification3'});
      }).catch(function(err){
          if(err.message.indexOf('phaseError')!=-1){
            toastr["error"]("Error: Not in a valid phase.");
          }else{
            toastr["error"]("Error: Already showed the winner!");
          }
      })
    },

    //Function to show the notification of auction phases
    showNotification: function(phase){
        var phaseId=App.biddingPhases[phase]
        var phaseText=App.auctionPhases[phaseId];
        $('#phase-notification-text').text(phaseText);
        toastr.info(phaseText, "", {"iconClass": 'toast-info notification' + phaseId});
    }
  };
  
  
  $(function() {
    $(window).load(function() {
        App.init();
        //Notification UI config
        toastr.options = {
            "showDuration": "1000",
            "positionClass": "toast-top-left",
            "preventDuplicates": true,
            "closeButton": true
        };
    });
  });
  