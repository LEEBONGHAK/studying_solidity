App = {
  web3: null,
  contracts: {},
  address:'  ',   
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
    App.contracts.Payment = new App.web3.eth.Contract(App.abi,App.address, {});
    App.web3.eth.getBalance(App.contracts.Payment._address).then((res)=>{ 
      jQuery('#channel_balance').text(web3.fromWei(res),"ether");
      // jQuery('#contract_address').text(App.contracts.Payment._address);
    })        
    App.web3.eth.getAccounts((err, accounts) => {  
      if(!err){
        App.currentAccount=accounts[0];
        App.contracts.Payment.methods.sender().call().then((res)=>{
          App.organizer=res;
          App.web3.eth.getBalance(App.organizer).then((res)=>{ jQuery('#organizer_balance').text(web3.fromWei(res),"ether");});

        });
        App.contracts.Payment.methods.recipient().call().then((res)=>{
          App.worker=res;
          App.web3.eth.getBalance(App.worker).then((res)=>{ jQuery('#worker_balance').text(web3.fromWei(res),"ether");});
          jQuery('#worker').val(App.worker);
          if(App.currentAccount==App.worker){                
            jQuery('#WorkersForm').css('display','block');                
          } 
        }); 
      }     
    }); 
    return App.bindEvents();
  },  

  bindEvents: function() {  
    $(document).on('click', '#transfer', function(){
      App.handleTransfer(jQuery('#workeramount').val(),jQuery('#signedMessage').val());
    });
  }, 


    handleTransfer:function(amount,signature){

      //toHex conversion to support big numbers
      if(App.web3.utils.isHexStrict(signature)){
      var weiamount=App.web3.utils.toWei(amount,'ether')
      var amount=App.web3.utils.toHex(weiamount)
      var option={from:App.worker}
      App.contracts.Payment.methods.claimPayment(amount,signature)
      .send(option)
      .on('receipt', (receipt) => {
        if(receipt.status){
            toastr.success("Funds are transferred to your account");
            // App.populateAddress();
            App.web3.eth.getBalance(App.contracts.Payment._address).then((res)=>{ jQuery('#channel_balance').text(web3.fromWei(res),"ether");})                                
          }
        else{
            toastr["error"]("Error in transfer");
          }
        })
      .on('error',(err)=>{
        if(err.message.indexOf('Signature')!=-1){
          toastr["error"]("Error: Not a valid Signature");
          return false;
        }else if(err.message.indexOf('recipient')!=-1){
          toastr["error"]("Error: Not an intended recipient");
          return false;
        }else if(err.message.indexOf('Insufficient')!=-1){
          toastr["error"]("Error: Insufficient funds");
          return false;
        }else{
          toastr["error"]("Error: Something went wrong");
          return false;
        }
      });  
    }
  else{
    toastr["error"]("Error: Please enter a valid signature");
    return false;
  }
  },
  abi:[
    {
      "constant": false,
      "inputs": [
        {
          "name": "amount",
          "type": "uint256"
        },
        {
          "name": "signature",
          "type": "bytes"
        }
      ],
      "name": "claimPayment",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "recipient",
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
      "constant": true,
      "inputs": [],
      "name": "sender",
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
      "inputs": [
        {
          "name": "recipientAddress",
          "type": "address"
        }
      ],
      "payable": true,
      "stateMutability": "payable",
      "type": "constructor"
    }
  ]
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