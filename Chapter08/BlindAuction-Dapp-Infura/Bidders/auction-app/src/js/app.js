App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    // url: 'http://127.0.0.1:7545',
    chairPerson:null,
    currentAccount:null,
    address:'',
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
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
        // If no injected web3 instance is detected, fallback to the TestRPC
        App.web3Provider = new Web3.providers.HttpProvider(App.url);
      }
      web3 = new Web3(App.web3Provider);  
      ethereum.enable();    //Enables metamask and gives the popup  
      return App.initContract();  
    },
  
    initContract: function() {
      App.contracts.BlindAuction = web3.eth.contract(App.abi).at(App.address)
      App.currentAccount = web3.eth.coinbase; // get current account
      jQuery('#current_account').text(web3.eth.coinbase);
      web3.eth.getBalance(web3.eth.coinbase,(b,r)=>{
        jQuery('#balance').text(web3.fromWei(parseInt(r)));
      })
      App.getCurrentPhase();  //get current phase
      App.getChairperson();   // get the chairperson
      return App.bindEvents();
    },
  
  
    bindEvents: function() {
        $(document).on('click', '#submit-bid', App.handleBid);
        $(document).on('click', '#withdraw-bid', App.handleWithdraw);
        $(document).on('click', '#generate-winner', App.handleWinner);
        $(document).on('click', '#submit-reveal', App.handleReveal); 
    },
    
    getCurrentPhase : function(){
    App.contracts.BlindAuction.currentPhase((e,r)=>{
      if(!e){
        App.currentPhase=r
        var notificationText = App.auctionPhases[App.currentPhase];
        $('#phase-notification-text').text(notificationText);
      }
    })
   
    },
  
    getChairperson : function(){
      App.contracts.BlindAuction.beneficiary((e,result)=>{
      if(!e){
        App.chairPerson=result
      }
    })
    },

    //Function to handle the bids
    handleBid: function() {
      event.preventDefault();
      var bidValue = $("#bet-value").val();
      var msgValue = $("#message-value").val();
      App.contracts.BlindAuction.bid(bidValue,{value:web3.toWei(msgValue, "ether")},(err,r)=>{
        if(!err){
           function pendingConfirmation() {
            web3.eth.getTransactionReceipt(r,(e,rec)=>{
              if(rec){
                clearInterval(myInterval);
                if(parseInt(rec.status)==1){
                  toastr.info("Your Bid is Placed!", "", {"iconClass": 'toast-info notification0'});
                }
                else
                toastr["error"]("Error in Bidding. Bidding Reverted!");
              }
              if(e){
                clearInterval(myInterval);
                console.log(e.message)
               }
             })
             
         }
         const myInterval = setInterval(pendingConfirmation, 3000);
        }else{
          console.log(err)
            if(err.message.indexOf('phaseError')!=-1){
              toastr["error"]("Error: Not in a valid phase.");
            }
            else if(err.message.indexOf('beneficiaryBid')!=-1){
              toastr["error"]("Error: Beneficiary can not bid. Only bidders can.");
            }else{
            toastr["error"]("Bidding Failed!");
          }
        }
      })
    },


    //Function to reveal the bids
    handleReveal: function() {
      event.preventDefault();
      var bidRevealValue = $("#bet-reveal").val();
      var bidRevealSecret = $("#password").val(); 
      App.contracts.BlindAuction.reveal(parseInt(bidRevealValue),bidRevealSecret,(err,res)=>{
        if(!err){
          function pendingConfirmation() {
            web3.eth.getTransactionReceipt(res,(err,receipt)=>{
              if(receipt){
                clearInterval(myInterval);
              if(parseInt(receipt.status) == 1){
                
                toastr.info("Your Bid is Revealed!", "", {"iconClass": 'toast-info notification0'});
              }else{
                toastr["error"]("Error in Revealing. Bidding Reverted!");
              }
            }
            if(err){
              clearInterval(myInterval);
              console.log(err)
             }
          })
            
        }

        const myInterval = setInterval(pendingConfirmation, 3000);
        }
        else{
          if(err.message.indexOf('phaseError')!=-1){
              toastr["error"]("Error: Not in a valid phase.");
              }else if(err.message.indexOf('beneficiaryReveal')!=-1){
                toastr["error"]("Error: Beneficiary cannot reveal.Only bidders can.");
              } else{
              toastr["error"]("Revealing Failed!");
            }
        }       
       })
      },  
  
    // Function to show the winner
    handleWinner : function() {
      App.contracts.BlindAuction.auctionEnd((err,res)=>{
        if(!err){
          function pendingConfirmation() {
          web3.eth.getTransactionReceipt(res,(err,receipt)=>{
            if(receipt){
              clearInterval(myInterval);
            App.contracts.BlindAuction.allEvents({
              fromBlock: 0,
              toBlock: 'latest',
              address: App.address,
              topics: [[web3.sha3('AuctionEnded(address,uint)')]]
            }, function(error, log){
              if (!error)
                if(log.transactionHash==receipt.logs[0].transactionHash){
              var winner = log.args.winner;
              var highestBid = web3.fromWei(log.args.highestBid.toNumber());
              var text="<br><br><b>Winner: </b>"+winner+"<br><br><b>Highest Bid: </b>"+highestBid+" wei";
              $('#winner').html(text);
              web3.eth.getBalance(web3.eth.coinbase,(b,r)=>{
                jQuery('#balance').text(web3.fromWei(parseInt(r)));
              })
              toastr.info("Highest bid is " + highestBid + " ETH <br>" + "Winner is " + winner, "", {"iconClass": 'toast-info notification3'});
                }
             });
          }if(err){         
              clearInterval(myInterval);
              console.log(err);       
            }
        })
      }
        const myInterval = setInterval(pendingConfirmation, 3000);
        }else{
          if(err.message.indexOf('phaseError')!=-1){
            toastr["error"]("Error: Not in a valid phase.");
          }else{
            toastr["error"]("Error: Something went wrong!");
          }
        }
      })
    },

    //Function to handle the withdrawal of bids
    handleWithdraw:function(){
      if(parseInt(App.currentPhase)==3){
        App.contracts.BlindAuction.withdraw((e,result)=>{
          if(!e){
            function pendingConfirmation() {
              web3.eth.getTransactionReceipt(result,(err,receipt)=>{
                if(receipt){
                  clearInterval(myInterval);
                  toastr.info("Withdrawal of the bid is done!");
              }if(err){         
                  clearInterval(myInterval);
                  console.log(err);       
                }
            })
          }
            const myInterval = setInterval(pendingConfirmation, 3000);
          }
        })
      }else{
        toastr["error"]("Not in a valid phase to withdraw bid!");
      }
    },

    //Function to show the notification of auction phases
      showNotification: function(phase){
          var phaseId=App.biddingPhases[phase]
          var phaseText=App.auctionPhases[phaseId];
          $('#phase-notification-text').text(phaseText);
          toastr.info(phaseText, "", {"iconClass": 'toast-info notification' + phaseId});
      },
    abi:[
      {
        "constant": true,
        "inputs": [],
        "name": "currentPhase",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "auctionEnd",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "beneficiary",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "value",
            "type": "uint256"
          },
          {
            "name": "secret",
            "type": "bytes32"
          }
        ],
        "name": "reveal",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "bids",
        "outputs": [
          {
            "name": "blindedBid",
            "type": "bytes32"
          },
          {
            "name": "deposit",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "highestBidder",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "blindBid",
            "type": "bytes32"
          }
        ],
        "name": "bid",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "advancePhase",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "highestBid",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "winner",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "highestBid",
            "type": "uint256"
          }
        ],
        "name": "AuctionEnded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "BiddingStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "RevealStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "AuctionInit",
        "type": "event"
      }
    ]
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
  