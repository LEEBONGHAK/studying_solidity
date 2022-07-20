App = {
    web3: null,
    contracts: {},   
    network_id:3,
    url:'',
    currentAccount:'',  
    worker:'',
    organizer:'',
    value:1000000000000000000,
    index:0,
    margin:10,
    left:15,
    init: function() {
      return App.initWeb3();
    },
  
    initWeb3: function() {         
      if (typeof web3 !== 'undefined') {
        App.web3 = new Web3(Web3.givenProvider);
      } else {
        App.web3 = new Web3(App.url);
      }
      ethereum.enable();      
      return App.initContract();  
    },

    initContract: function() {   
      $.getJSON('MPC.json', function(data) {       
        App.contracts.Payment = new App.web3.eth.Contract(data.abi, data.networks[App.network_id].address, {});

        App.web3.eth.getBalance(App.contracts.Payment._address).then((res)=>{ 
          jQuery('#channel_balance').text(web3.fromWei(res),"ether");
          jQuery('#contract_address').text(App.contracts.Payment._address);
        })
        
        App.web3.eth.getAccounts((err, accounts) => {  
          if(!err){
            App.currentAccount=accounts[0];
            App.contracts.Payment.methods.sender().call().then((res)=>{
              App.organizer=res;
              App.web3.eth.getBalance(App.organizer).then((res)=>{ jQuery('#organizer_balance').text(web3.fromWei(res),"ether");});
              if(App.currentAccount==App.organizer){
                jQuery('#OrganizersForm').css('display','block');
                jQuery('#Signatures').css('display','block');              
              } 
            });
            App.contracts.Payment.methods.recipient().call().then((res)=>{
              App.worker=res;
              App.web3.eth.getBalance(App.worker).then((res)=>{ jQuery('#worker_balance').text(web3.fromWei(res),"ether");});
              jQuery('#worker').val(App.worker);
            }); 
          }     
        });
      })
      return App.bindEvents();
    },  
  
    bindEvents: function() {  
      $(document).on('click', '#sign', function(){
         App.handleSignature(jQuery('#worker').val(),jQuery('#amount').val());
      });
    }, 
  
    handleSignature:function(worker,amount){      
      if(worker!=App.worker){
        alert('Error in worker\'s address.')
        return false;
      }
      if(amount<=0){
        alert('Please correct the amount.');
        return false;
      }
      var weiamount=App.web3.utils.toWei(amount, 'ether');
      var message = App.constructPaymentMessage(App.contracts.Payment._address, weiamount);
      App.signMessage(message,amount);      
    },

    constructPaymentMessage:function(contractAddress, weiamount) {
      return App.web3.utils.soliditySha3(contractAddress,weiamount)
    },
  
    signMessage:function (message,amount) {      
      web3.personal.sign(message, web3.eth.defaultAccount, function(err, signature) {
        if(!err)
        {
          var box='<div class="check col-md-12 col-lg-12" style="position:absolute;margin-top:'+App.margin+'px;z-index:'+App.index+';left:'+App.left+'px">'+
                  '<span class="amount"><b>'+amount+' ETH </b></span>'+
                  '<p class="signature">'+signature+'</p>'+
                  '</div>';
          App.index=App.index+1;
          App.margin=App.margin+30;
          App.left=App.left+5;
          jQuery('#allchecks').append(box); 
        } 
        else{
          toastr["error"]("Error: Error in signing the signature");
          return false;
        }
      });
    },
  }
  
  $(function() {
    $(window).load(function() {
      App.init();
      toastr.options = {
        "positionClass": "toast-bottom-right",
        "preventDuplicates": true,
        "closeButton": true
      };
    });
  });
  