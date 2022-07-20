App = {
  web3: null,
  contracts: {},
  currentAccount: '',
  personNumber: '',
  chairPerson: '',
  grades: null,
  address: '',    // Address where the smart contract has been deployed
  init: function () {
    return App.initWeb3();
  },


  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3 = new Web3(Web3.givenProvider);
    } else {
      App.web3 = new Web3(App.url);
    }
    ethereum.enable();

    // Using grades in data.json, populates App.grades
    $.getJSON('data.json', function (data) {
      App.grades = data.grades;
    });
    return App.initContract();
  },

  // Initialises App with details of the smart contract e.g. location of abi, address of smart contract
  initContract: function () {
    App.contracts.Certification = new App.web3.eth.Contract(App.abi, App.address, {});
    App.currentAccount = App.web3._provider.selectedAddress;             // Sets the selected Metamask Account address as the current Account for transactions
    App.getChairperson();                                                // Fetches the address of the chairperson i.e. the account that was used to deploy the contract

    // Fetches previously entered grades for students upon Login
    if ($('#course_form').length)
      App.loadOldGrades();
    return App.bindEvents();
  },

  // Fetches the address of the account used to deploy the smart contract
  getChairperson: function () {

    //Accesses the public chairperson field in the smart to fetch the chairperson's address
    App.contracts.Certification.methods.chairPerson()
      .call()
      .then((res) => {
        App.chairPerson = res;

        // If the current account address in Metamask equals the address of the chairperson, then show the 'Destroy Contract' button, otherwise, hide it for other users.
        if (App.currentAccount.toLowerCase() == App.chairPerson.toLowerCase()) {
          $('#kill').append('<button type="button" class="btn btn-lg btn-danger mt-3 mb-3 " id="destroy">Destroy contract</button>');
        }
      })
  },

  // Used for triggering specific events on button clicks
  bindEvents: function () {

    //If the button with id=register is clicked, call 'handleRegistration' function and pass the entered person number as a parameter 
    $(document).on('click', '#register', function () {
      App.handleRegistration(jQuery('#personNumber').val());
    });

    // If the button with id=login is clicked, call 'handlelogin' function and pass the entered person number as parameter
    $(document).on('click', '#login', function () {
      App.handleLogin(jQuery('#personNumber').val());
    });

    // If the button with id=addCourse is clicked, call addCourse function and pass the course type, course value and the grade as parameters
    $(document).on('click', '#addCourse', function () {
      App.addCourse($("#course_type").val(), $("#course").val(), $("#grade").val());
    });

    // If button with id=checkEligibility is called, call 'checkEligibility' function
    $(document).on('click', '#checkEligibility', function () {
      App.checkEligibility();
    });

    // if button with id=destroy is clicked, call 'destroy' function
    $(document).on('click', '#destroy', function () {
      App.destroy();
    });
  },

  // Fetches previously entered grades of a student
  loadOldGrades: function () {
    let option = { from: App.currentAccount }

    // Accesses the publically available mapping of 'registeredStudents' to fetch their grades (if it exists)
    // Note that the data is returned for the student associated with the current Metamask address
    App.contracts.Certification.methods.registeredStudents(App.currentAccount)
      .call(option)
      .then((r) => {
        // console.log(r);
        // For the Student object returned, we check if any of the grades are set. If they are, then they are displayed.
        // The grades are displayed based on the score to grade mapping stored in data.json
        if (parseInt(r.prereq115) != 0)
          $('#115').text(" - " + App.grades[r.prereq115]);
        if (parseInt(r.prereq116) != 0)
          $('#116').text(" - " + App.grades[r.prereq116]);
        if (parseInt(r.core250) != 0)
          $('#250').text(" - " + App.grades[r.core250]);
        if (parseInt(r.core486) != 0)
          $('#486').text(" - " + App.grades[r.prereq116]);
        if (parseInt(r.core487) != 0)
          $('#487').text(" - " + App.grades[r.core487]);
        if (parseInt(r.domainSpecificGrade) != 0)
          $('#' + r.domainSpecificCourse).text(" - " + App.grades[r.domainSpecificGrade]);
        if (parseInt(r.capstoneGrade) != 0)
          $('#' + r.capstoneCourse).text(" - " + App.grades[r.capstoneGrade]);
      });
  },

  // Registers students by associating the Metamask address (used during the transaction) with the personNumber entered by the user
  handleRegistration: function (personNumber) {
    // Sends the Metamask address to the smart contract which can be accessed using 'msg.sender' parameter
    let option = { from: App.currentAccount }
    App.contracts.Certification.methods.registerStudent(personNumber)
      .send(option)
      .on('receipt', (receipt) => {
        console.log(receipt);
      })
      .on('error', (error) => {
        $('#message').text('Registration failed. Person number or account address already exists.')
      })
  },

  // Used for Login. It calls the 'loginStudent' function in the smartcontract which validates the association 
  // between the metamask address used for the transaction and the person number entered
  handleLogin: function (personNumber) {
    let option = { from: App.currentAccount }
    App.contracts.Certification.methods.loginStudent(personNumber)
      .call(option)
      .then((result) => {
        if (result) {
          App.personNumber = personNumber;
          window.location.href = "/dic?pno=" + personNumber;            //If value returned is 'True', then the user is redirected to the next page
        } else {
          $('#message').text('Login failed. Incorrect person number or account address.')   // If value returned is 'False', then this message is displayed
        }
      })

  },

  // Undeploys the smart contract. Only a chairperson is able to perform this action
  destroy: function () {
    var option = { from: App.currentAccount }
    App.contracts.Certification.methods.destroy()
      .send(option)
      .on('receipt', r => {
        console.log(r)
      })
  },

  // Used to associate a grade to a course taken by the student
  addCourse: function (course_type, course, grade) {
    let option = { from: App.currentAccount }
    var url = $(location).attr('href');
    var personNumber = url.split('=')[1];
    App.personNumber = personNumber;

    // Depending on the course_type i.e. pre_req, core, project or domain, a particular function
    // in the smart contract is invoked. Using this, the grade entered by the student for a particular
    // course gets saved into the smart contract
    if (course_type == "pre_req") {
      App.contracts.Certification.methods.addPreRequisiteCourse(course, grade)
        .send(option)
        .on('receipt', (receipt) => {
          App.courseGrades(course, grade);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
    else if (course_type == "core") {
      App.contracts.Certification.methods.addCoreCourse(course, grade)
        .send(option)
        .on('receipt', (receipt) => {
          App.courseGrades(course, grade);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
    else if (course_type == "domain") {
      App.contracts.Certification.methods.addDomainSpecificCourse(course, grade)
        .send(option)
        .on('receipt', (receipt) => {
          // Clearing previous selection
          let domain = ["368", "435", "455", "456", "460", "462", "463", "467", "469", "470", "474"]
          domain.forEach(elem => {
            $('#' + elem).text("")
          });
          App.courseGrades(course, grade);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
    else if (course_type == "project") {
      App.contracts.Certification.methods.addCapstoneCourse(course, grade)
        .send(option)
        .on('receipt', (receipt) => {
          // Clearing previous selection
          let project = ["495", "496", "498", "499"];
          project.forEach(elem => {
            $('#' + elem).text("")
          });
          App.courseGrades(course, grade);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
  },

  // Once the grade is successfully updated on the smart contract, the same is reflected on the UI, 
  // which is done using the following function
  courseGrades: function (course, grade) {
    // DO we need these?
    // var url = $(location).attr('href');
    // var personNumber = url.split('=')[1];
    // App.personNumber = personNumber;

    $('#' + course).text(" - " + App.grades[grade])
  },

  // Used to set icons for 'loading'
  setLoadingIcons: function () {
    var node = document.createElement("i");
    node.className = "fa fa-spinner fa-2x circled bg-skin float-left"
    document.getElementById("pre-requisite-icon").appendChild(node);

    var node = document.createElement("i");
    node.className = "fa fa-spinner fa-2x circled bg-skin float-left"
    document.getElementById("required-courses-icon").appendChild(node);

    var node = document.createElement("i");
    node.className = "fa fa-spinner fa-2x circled bg-skin float-left"
    document.getElementById("gpa-requirement-icon").appendChild(node);

    var node = document.createElement("i");
    node.className = "fa fa-spinner fa-2x circled bg-skin float-left"
    document.getElementById("project-requirement-icon").appendChild(node);

    var node = document.createElement("i");
    node.className = "fa fa-spinner fa-2x circled bg-skin float-left"
    document.getElementById("domain-requirement-icon").appendChild(node);
  },

  // Not Used
  getGPA: function () {
    let option = { from: App.currentAccount }
    var url = $(location).attr('href');
    var personNumber = url.split('=')[1];
    App.personNumber = personNumber;
    App.contracts.Certification.methods.checkGPARequirement(personNumber)
      .send(option)
      .on('receipt', (r) => {
        console.log(r)
      })

  },

  // This function is trigged when the user clicks on the 'Check Eligibility' button

  // Used to check if a user has satisfied all requirements
  // If the user has satisfied all the requirements, then their GPA is displayed,
  // otherwise an appropriate message is deplayed based on the events emiited by the smart contract
  checkEligibility: function () {
    let option = { from: App.currentAccount }
    var url = $(location).attr('href');
    var personNumber = url.split('=')[1];
    App.personNumber = personNumber;

    App.contracts.Certification.methods.checkEligibility(personNumber)
      .send(option)
      .on('receipt', (r) => {
        $("#result").css("display", "block");
        App.setLoadingIcons();
        let events = r.events;

        App.setContent(events);     // Sends the events emitted to the setContent function, which is used to display appropriate messages

        // console.log(App.contracts.Certification.methods);

        if (typeof events.GPA !== "undefined") {
          $("#gpa-value").text(' : ' + parseInt(events.GPA.returnValues.result) * 0.01);
        }
        else $("#gpa-value").text(' : --');

      })
      .on('error', err => {
        console.log(err)
      });

  },

  // used to set the failure icon
  setFailureIcon: function (icon_id) {
    var node = document.createElement("i");
    node.className = "fa fa-remove fa-2x circled bg-red float-left"
    document.getElementById(icon_id).innerHTML = '';
    document.getElementById(icon_id).appendChild(node);
  },

  // used to set the success icon
  setSuccessIcon: function (icon_id) {
    var node = document.createElement("i");
    node.className = "fa fa-check fa-2x circled bg-skin float-left"
    document.getElementById(icon_id).innerHTML = '';
    document.getElementById(icon_id).appendChild(node);
  },

  // used to set the result text passed as parameter
  setResultText: function (result_id, text) {
    var node = document.createElement("small");
    node.innerHTML = text;
    document.getElementById(result_id).innerHTML = '';
    document.getElementById(result_id).appendChild(node);
  },

  // Displays appropriate messages based on the events emitted for each course_type and gpa 
  // In case any requirement is unfulfilled, the user is notified accordingly
  setContent: function (data) {

    if (typeof data.preRequisiteSatisfied !== "undefined") {
      App.setResultText("pre-requisite-result", "Satisfied all the pre-requisite courses");                       // Displayed if pre-requisite course requirement is satisfied
      App.setSuccessIcon("pre-requisite-icon");
    }
    else {
      App.setResultText("pre-requisite-result", "Should satisfy all the pre-requisite course requirements");      // Displayed if pre-requisite course requirement is not satisfied
      App.setFailureIcon("pre-requisite-icon");
    }

    if (typeof data.coreCoursesSatisfied !== "undefined") {
      App.setResultText("required-result", "Satisfied all the data intenstive core courses");                     // Displayed if core course requirement is satisfied
      App.setSuccessIcon("required-courses-icon");
    }
    else {
      App.setResultText("required-result", "Should satisfy all the data intenstive core course requirements");    // Displayed if core course requirement is not satisfied
      App.setFailureIcon("required-courses-icon");
    }

    if (typeof data.domainRequirementSatisfied !== "undefined") {
      App.setResultText("domain-result", "Satisfied one or more domain courses");                                // Displayed if domain specific course requirement is satisfied
      App.setSuccessIcon("domain-requirement-icon");
    }
    else {
      App.setResultText("domain-result", "Should satisfy any one of the domain course requirements");             // Displayed if domain specific course requirement is not satisfied
      App.setFailureIcon("domain-requirement-icon");
    }

    if (typeof data.projectRequirementSatisfied !== "undefined") {
      App.setResultText("project-result", "Satisfied one or more project courses");                              // Displayed if project specific course requirement is satisfied
      App.setSuccessIcon("project-requirement-icon");
    }
    else {
      App.setResultText("project-result", "Should satisfy any one of the project course requirements");           // Displayed if project specific course requirement is not satisfied
      App.setFailureIcon("project-requirement-icon");
    }

    if (typeof data.GPARequirementSatisfied !== "undefined") {
      App.setResultText("gpa-result", "Satified GPA requirements");                                               // Displayed if GPA requirement is satisfied
      App.setSuccessIcon("gpa-requirement-icon");
    }
    else {
      App.setFailureIcon("gpa-requirement-icon");
      if (typeof data.GPA !== "undefined")
        App.setResultText("gpa-result", "GPA average should be greater than 2.5");
      else App.setResultText("gpa-result", "Grades of all courses must be entered to generate GPA");
    }
  },

  abi: [
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
          "internalType": "uint256",
          "name": "result",
          "type": "uint256"
        }
      ],
      "name": "GPA",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "GPARequirementSatisfied",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "coreCoursesSatisfied",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "domainRequirementSatisfied",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "preRequisiteSatisfied",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "projectRequirementSatisfied",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "chairPerson",
      "outputs": [
        {
          "internalType": "address",
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
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "registeredStudents",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "prereq115",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "prereq116",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "core250",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "core486",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "core487",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "domainSpecificCourse",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "domainSpecificGrade",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "capstoneCourse",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "capstoneGrade",
          "type": "uint256"
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
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "registerStudent",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "loginStudent",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
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
          "internalType": "uint256",
          "name": "courseNumber",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "grade",
          "type": "uint256"
        }
      ],
      "name": "addPreRequisiteCourse",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "courseNumber",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "grade",
          "type": "uint256"
        }
      ],
      "name": "addCoreCourse",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "courseNumber",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "grade",
          "type": "uint256"
        }
      ],
      "name": "addDomainSpecificCourse",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "courseNumber",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "grade",
          "type": "uint256"
        }
      ],
      "name": "addCapstoneCourse",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "personNumber",
          "type": "uint256"
        }
      ],
      "name": "checkEligibility",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "destroy",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
}

$(function () {
  $(window).load(function () {
    App.init();
    toastr.options = {
      "positionClass": "right newtoast",
      "preventDuplicates": true,
      "closeButton": true
    };
  });
});
