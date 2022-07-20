App = {
  web3: null,
  contracts: {},
  currentAccount: '',
  personNumber: '',
  chairPerson: '',
  grades: null,
  address: '', // address where the smart contract has been deployed
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
    $.getJSON('data.json', function (data) {
      App.grades = data.grades;
    });
    return App.initContract();
  },

  initContract: function () {
    // $.getJSON('DICCertification.json', function (data) {
    //   App.contracts.Certification = new App.web3.eth.Contract(data.abi, data.networks[App.network_id].address, {});
    //   App.currentAccount = App.web3._provider.selectedAddress;
    //   if ($('#course_form').length)
    //     App.loadOldGrades();
    //   App.courseGrades();
    //   // App.getGPA();
    // })

    App.contracts.Certification = new App.web3.eth.Contract(App.abi, App.address, {});
    App.currentAccount = App.web3._provider.selectedAddress;
    App.getChairperson();
    if ($('#course_form').length)
      App.loadOldGrades();
    // App.courseGrades();

    return App.bindEvents();
  },

  getChairperson: function () {
    App.contracts.Certification.methods.chairPerson()
      .call()
      .then((res) => {
        App.chairPerson = res;
        if (App.currentAccount.toLowerCase() == App.chairPerson.toLowerCase()) {
          $('#kill').append('<button type="button" class="btn btn-lg btn-danger mt-3 mb-3 " id="destroy">Destroy contract</button>');
        }
      })
  },

  bindEvents: function () {
    $(document).on('click', '#register', function () {
      App.handleRegistration(jQuery('#personNumber').val());
    });

    $(document).on('click', '#login', function () {
      App.handleLogin(jQuery('#personNumber').val());
    });

    $(document).on('click', '#addCourse', function () {
      App.addCourse($("#course_type").val(), $("#course").val(), $("#grade").val());
    });

    $(document).on('click', '#checkEligibility', function () {
      App.checkEligibility();
    });

    $(document).on('click', '#destroy', function () {
      App.destroy();
    });
  },

  loadOldGrades: function () {
    let option = { from: App.currentAccount }
    App.contracts.Certification.methods.registeredStudents(App.currentAccount)
      .call(option)
      .then((r) => {
        // console.log(r);
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

  handleRegistration: function (personNumber) {
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

  handleLogin: function (personNumber) {
    let option = { from: App.currentAccount }
    App.contracts.Certification.methods.loginStudent(personNumber)
      .call(option)
      .then((result) => {
        if (result) {
          App.personNumber = personNumber;
          window.location.href = "/dic?pno=" + personNumber;
        } else {
          $('#message').text('Login failed. Incorrect person number or account address.')
        }
      })

  },

  destroy: function () {
    var option = { from: App.currentAccount }
    App.contracts.Certification.methods.destroy()
      .send(option)
      .on('receipt', r => {
        console.log(r)
      })
  },

  addCourse: function (course_type, course, gpa) {
    let option = { from: App.currentAccount }
    var url = $(location).attr('href');
    var personNumber = url.split('=')[1];
    App.personNumber = personNumber;

    if (course_type == "pre_req") {
      App.contracts.Certification.methods.addPreRequisiteCourse(course, gpa)
        .send(option)
        .on('receipt', (receipt) => {
          App.courseGrades(course, gpa);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
    else if (course_type == "core") {
      App.contracts.Certification.methods.addCoreCourse(course, gpa)
        .send(option)
        .on('receipt', (receipt) => {
          App.courseGrades(course, gpa);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
    else if (course_type == "domain") {
      App.contracts.Certification.methods.addDomainSpecificCourse(course, gpa)
        .send(option)
        .on('receipt', (receipt) => {
          // Clearing previous selection
          let domain = ["368", "435", "455", "456", "460", "462", "463", "467", "469", "470", "474"]
          domain.forEach(elem => {
            $('#' + elem).text("")
          });
          App.courseGrades(course, gpa);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
    else if (course_type == "project") {
      App.contracts.Certification.methods.addCapstoneCourse(course, gpa)
        .send(option)
        .on('receipt', (receipt) => {
          // Clearing previous selection
          let project = ["495", "496", "498", "499"];
          project.forEach(elem => {
            $('#' + elem).text("")
          });
          App.courseGrades(course, gpa);
        })
        .on('error', (err) => {
          console.log(err);
        });
    }
  },
  courseGrades: function (course, gpa) {
    // DO we need these?
    // var url = $(location).attr('href');
    // var personNumber = url.split('=')[1];
    // App.personNumber = personNumber;

    $('#' + course).text(" - " + App.grades[gpa])
  },
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

        App.setContent(events);

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
  setFailureIcon: function (icon_id) {
    var node = document.createElement("i");
    node.className = "fa fa-remove fa-2x circled bg-red float-left"
    document.getElementById(icon_id).innerHTML = '';
    document.getElementById(icon_id).appendChild(node);
  },

  setSuccessIcon: function (icon_id) {
    var node = document.createElement("i");
    node.className = "fa fa-check fa-2x circled bg-skin float-left"
    document.getElementById(icon_id).innerHTML = '';
    document.getElementById(icon_id).appendChild(node);
  },

  setResultText: function (result_id, text) {
    var node = document.createElement("small");
    node.innerHTML = text;
    document.getElementById(result_id).innerHTML = '';
    document.getElementById(result_id).appendChild(node);
  },

  setContent: function (data) {

    if (typeof data.preRequisiteSatisfied !== "undefined") {
      App.setResultText("pre-requisite-result", "Satisfied all the pre-requisite courses");
      App.setSuccessIcon("pre-requisite-icon");
    }
    else {
      App.setResultText("pre-requisite-result", "Should satisfy all the pre-requisite course requirements");
      App.setFailureIcon("pre-requisite-icon");
    }

    if (typeof data.coreCoursesSatisfied !== "undefined") {
      App.setResultText("required-result", "Satisfied all the data intenstive core courses");
      App.setSuccessIcon("required-courses-icon");
    }
    else {
      App.setResultText("required-result", "Should satisfy all the data intenstive core course requirements");
      App.setFailureIcon("required-courses-icon");
    }

    if (typeof data.domainRequirementSatisfied !== "undefined") {
      App.setResultText("domain-result", "Satisfied one or more domain courses");
      App.setSuccessIcon("domain-requirement-icon");
    }
    else {
      App.setResultText("domain-result", "Should satisfy any one of the domain course requirements");
      App.setFailureIcon("domain-requirement-icon");
    }

    if (typeof data.projectRequirementSatisfied !== "undefined") {
      App.setResultText("project-result", "Satisfied one or more project courses");
      App.setSuccessIcon("project-requirement-icon");
    }
    else {
      App.setResultText("project-result", "Should satisfy any one of the project course requirements");
      App.setFailureIcon("project-requirement-icon");
    }

    if (typeof data.GPARequirementSatisfied !== "undefined") {
      App.setResultText("gpa-result", "Satified GPA requirements");
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
