const DCC = artifacts.require('../contracts/DICCertification.sol');
const truffleAssert = require('truffle-assertions');
const assert = require('assert');

var admin;
var dcc;

contract('DCC Dapp', (accounts)=>{

    const alreadyRegisteredError = "Student has already registered";
    const invalidCourse = "Invalid course information provided";
    const invalidStudent = "Invalid student";

    beforeEach(async () => {
        admin = accounts[0];
        dcc = await DCC.new();
        // console.log(dcc);
        // console.log(Object.keys(dcc));
        // let Student = await dcc.registeredStudents(accounts[1], {from: accounts[1]});
        // console.log(Student);
    });

    describe('Register', () => {
        it('Success on register for one user.', async () => {
            await truffleAssert.passes(
                dcc.registerStudent(123456789, {from: accounts[1]}),
                "This method should pass"
            );
        });

        it('Failure on registering twice for same user.', async () => {
            await dcc.registerStudent(123456789, {from: accounts[1]});
            await truffleAssert.fails(
                dcc.registerStudent(123456789, {from: accounts[1]}),
                truffleAssert.ErrorType.REVERT,
                alreadyRegisteredError,
                alreadyRegisteredError
            );
        });

        it('Failure on registering again with different person number.', async () => {
            await dcc.registerStudent(123456789, {from: accounts[1]});
            await truffleAssert.fails(
                dcc.registerStudent(987654321, {from: accounts[1]}),
                truffleAssert.ErrorType.REVERT,
                alreadyRegisteredError,
                alreadyRegisteredError
            );
        });
    });

    describe('Login', () => {
        
        beforeEach(async () => {
            await dcc.registerStudent(123456789, {from: accounts[1]});
        });

        it('Success on login for single user.', async () => {

            let answer = await dcc.loginStudent(123456789, {from: accounts[1]});
            assert.equal(answer, true, "Login failed.");
        });

        it('Failure on login with incorrect person number and account pair.', async () => {
            
            let answer = await dcc.loginStudent(987654321, {from: accounts[1]});
            assert.equal(answer, false, "Login should fail.");
            answer = await dcc.loginStudent(123456789, {from: accounts[2]});
            assert.equal(answer, false, "Login should fail.");
        });

    });

    describe('Course Additions', () => {
        
        beforeEach(async () => {
            await dcc.registerStudent(123456789, {from: accounts[1]});
        });

        describe('Pre-requisite Courses', ()=>{

            it('Success on adding grades for pre-requisite courses.', async () => {

                await truffleAssert.passes(
                    dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addPreRequisiteCourse(116, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Success on adding grade for a pre-requisite course twice.', async () => {
    
                await truffleAssert.passes(
                    dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addPreRequisiteCourse(115, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Failure on adding grade for invalid pre-requisite course.', async () => {
    
                await truffleAssert.fails(
                    dcc.addPreRequisiteCourse(250, 400, {from: accounts[1]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidCourse,
                    invalidCourse
                );
            });
    
            it('Failure on adding grade for invalid student.', async () => {
    
                await truffleAssert.fails(
                    dcc.addPreRequisiteCourse(115, 400, {from: accounts[2]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidStudent,
                    invalidStudent
                );
            });
        });

        describe('Core Courses', ()=>{
            it('Success on adding grades for core courses.', async () => {

                await truffleAssert.passes(
                    dcc.addCoreCourse(250, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addCoreCourse(486, 300, {from: accounts[1]}),
                    "This method should pass"
                );

                await truffleAssert.passes(
                    dcc.addCoreCourse(487, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Success on adding grade for a core course twice.', async () => {
    
                await truffleAssert.passes(
                    dcc.addCoreCourse(250, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addCoreCourse(250, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Failure on adding grade for invalid core course.', async () => {
    
                await truffleAssert.fails(
                    dcc.addCoreCourse(666, 400, {from: accounts[1]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidCourse,
                    invalidCourse
                );
            });
    
            it('Failure on adding grade for invalid student.', async () => {
    
                await truffleAssert.fails(
                    dcc.addCoreCourse(250, 400, {from: accounts[2]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidStudent,
                    invalidStudent
                );
            });
        });

        describe('Domain Specific Courses', ()=>{
            it('Success on adding grade for a domain specific course.', async () => {
                await truffleAssert.passes(
                    dcc.addDomainSpecificCourse(368, 400, {from: accounts[1]}),
                    "This method should pass"
                );
            });

            it('Success on adding grades for 2 different domain specific courses.', async () => {
                await truffleAssert.passes(
                    dcc.addDomainSpecificCourse(460, 300, {from: accounts[1]}),
                    "This method should pass"
                );

                await truffleAssert.passes(
                    dcc.addDomainSpecificCourse(470, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Success on adding grade for a domain specific course twice.', async () => {
    
                await truffleAssert.passes(
                    dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addDomainSpecificCourse(460, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Failure on adding grade for invalid domain specific course.', async () => {
                await truffleAssert.fails(
                    dcc.addDomainSpecificCourse(-1, 400, {from: accounts[1]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidCourse,
                    invalidCourse
                );
            });
    
            it('Failure on adding grade for invalid student.', async () => {
    
                await truffleAssert.fails(
                    dcc.addDomainSpecificCourse(460, 400, {from: accounts[2]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidStudent,
                    invalidStudent
                );
            });
        });
        
        describe('Capstone Project', ()=>{
            it('Success on adding grade for a capstone course.', async () => {
                await truffleAssert.passes(
                    dcc.addCapstoneCourse(499, 400, {from: accounts[1]}),
                    "This method should pass"
                );
            });

            it('Success on adding grades for 2 different capstone courses.', async () => {
    
                await truffleAssert.passes(
                    dcc.addCapstoneCourse(498, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addCapstoneCourse(499, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Success on adding grade for a capstone course twice.', async () => {
    
                await truffleAssert.passes(
                    dcc.addCapstoneCourse(499, 400, {from: accounts[1]}),
                    "This method should pass"
                );
    
                await truffleAssert.passes(
                    dcc.addCapstoneCourse(499, 300, {from: accounts[1]}),
                    "This method should pass"
                );
            });
    
            it('Failure on adding grades for invalid capstone course.', async () => {
                await truffleAssert.fails(
                    dcc.addCapstoneCourse(-1, 400, {from: accounts[1]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidCourse,
                    invalidCourse
                );
            });
    
            it('Failure on adding grades for invalid student.', async () => {
                await truffleAssert.fails(
                    dcc.addCapstoneCourse(499, 400, {from: accounts[2]}),
                    truffleAssert.ErrorType.REVERT,
                    invalidStudent,
                    invalidStudent
                );
            });
        });
        
    });

    describe('Events and Eligibility', () => {
        beforeEach(async () => {
            await dcc.registerStudent(123456789, {from: accounts[1]});
        });

        it('Success on capturing emitted event preRequisiteSatisified.', async () => {
            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 366, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'preRequisiteSatisified', (ev) => {
                return ev.personNumber == 123456789;
            });
            // truffleAssert.eventEmitted(result, 'preRequisiteSatisified', null);
        });

        it('Success on capturing emitted event coreCoursesSatisfied.', async () => {
            await dcc.addCoreCourse(250, 400, {from: accounts[1]});
            await dcc.addCoreCourse(486, 400, {from: accounts[1]});
            await dcc.addCoreCourse(487, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'coreCoursesSatisfied', (ev) => {
                return ev.personNumber == 123456789;
            });
            // truffleAssert.eventEmitted(result, 'coreCoursesSatisfied', null);
        });

        it('Success on capturing emitted event domainRequirementSatisfied.', async () => {
            await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'domainRequirementSatisfied', (ev) => {
                return ev.personNumber == 123456789;
            });
            // truffleAssert.eventEmitted(result, 'domainRequirementSatisfied', null);
        });

        it('Success on capturing emitted event projectRequirementSatisfied.', async () => {
            await dcc.addCapstoneCourse(499, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'projectRequirementSatisfied',(ev) => {
                return ev.personNumber == 123456789;
            });
            // truffleAssert.eventEmitted(result, 'projectRequirementSatisfied', null);
        });

        it('Success on capturing emitted event GPARequirementSatisfied.', async () => {
            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 366, {from: accounts[1]});
            await dcc.addCoreCourse(250, 400, {from: accounts[1]});
            await dcc.addCoreCourse(486, 400, {from: accounts[1]});
            await dcc.addCoreCourse(487, 400, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'GPARequirementSatisfied', (ev) => {
                return ev.personNumber == 123456789;
            });
            // truffleAssert.eventEmitted(result, 'GPARequirementSatisfied', null);
        });
        
        it('Success on capturing emitted event GPA.', async () => {
            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 366, {from: accounts[1]});
            await dcc.addCoreCourse(250, 400, {from: accounts[1]});
            await dcc.addCoreCourse(486, 400, {from: accounts[1]});
            await dcc.addCoreCourse(487, 400, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'GPA', ev => {
                return ev.result = 400;
            });
            // truffleAssert.eventEmitted(result, 'GPA', null);
        });

        it('Success on capturing emitted event GPA even if GPA < 2.5.', async () => {
            await dcc.addPreRequisiteCourse(115, 200, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 200, {from: accounts[1]});
            await dcc.addCoreCourse(250, 200, {from: accounts[1]});
            await dcc.addCoreCourse(486, 200, {from: accounts[1]});
            await dcc.addCoreCourse(487, 200, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 200, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 200, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventEmitted(result, 'GPA', ev => {
                return ev.result == 200;
            });
            // truffleAssert.eventEmitted(result, 'GPA', null);
        });

        it('Success on eligibility criteria.', async () => {
            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 366, {from: accounts[1]});
            await dcc.addCoreCourse(250, 400, {from: accounts[1]});
            await dcc.addCoreCourse(486, 400, {from: accounts[1]});
            await dcc.addCoreCourse(487, 400, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility.call(123456789, {from: accounts[1]});
            assert.equal(result, true);
            // console.log(result);
            // truffleAssert.eventEmitted(result, 'GPA', null);
        });

        it('Failure on capturing emitted event preRequisiteSatisified with partial data.', async () => {
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'preRequisiteSatisified', null);

            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'preRequisiteSatisified', null);
        });

        it('Failure on capturing emitted event coreCoursesSatisfied with partial data.', async () => {
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'coreCoursesSatisfied', null);
            
            await dcc.addCoreCourse(250, 400, {from: accounts[1]});
            result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'coreCoursesSatisfied', null);
            
            await dcc.addCoreCourse(486, 400, {from: accounts[1]});
            result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'coreCoursesSatisfied', null);

        });

        it('Failure on capturing emitted event domainRequirementSatisfied with no data.', async () => {
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'domainRequirementSatisfied', null);
        });

        it('Failure on capturing emitted event projectRequirementSatisfied with no data.', async () => {
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'projectRequirementSatisfied', null);
        });

        it('Failure on capturing emitted event GPARequirementSatisfied with GPA lower than 2.5.', async () => {
            await dcc.addPreRequisiteCourse(115, 233, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 233, {from: accounts[1]});
            await dcc.addCoreCourse(250, 233, {from: accounts[1]});
            await dcc.addCoreCourse(486, 233, {from: accounts[1]});
            await dcc.addCoreCourse(487, 233, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 233, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 200, {from: accounts[1]});
            let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
            truffleAssert.eventNotEmitted(result, 'GPARequirementSatisfied', null);
        });

        it('Failure on eligibility criteria.', async () => {
            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            // await dcc.addPreRequisiteCourse(116, 366, {from: accounts[1]});
            await dcc.addCoreCourse(250, 400, {from: accounts[1]});
            // await dcc.addCoreCourse(486, 400, {from: accounts[1]});
            // await dcc.addCoreCourse(487, 400, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 400, {from: accounts[1]});
            let result = await dcc.checkEligibility.call(123456789, {from: accounts[1]});
            assert.equal(result, false);
        });
    });

    // describe('Destroy', ()=>{
    //     it('Success on selfdestruction.', async () => {
    //         await dcc.registerStudent(123456789, {from: accounts[1]});
    //         let Student = await dcc.registeredStudents(accounts[1], {from: accounts[1]});
    //         // console.log(Student);
    //         assert.equal(Student.personNumber.toNumber(), 123456789);
    //         await dcc.destroy({from: accounts[1]});
    //         // await truffleAssert.fails(dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]}));
    //         Student = await dcc.registeredStudents(accounts[1], {from: accounts[1]});
    //         console.log(Student.personNumber.toNumber());
    //     });
    // });

    describe('Complete runs', ()=>{
        // it('Success on run with single user', ()=>{

        //     await dcc.registerStudent(123456789, {from: accounts[1]});

        //     await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
        //     await dcc.addPreRequisiteCourse(116, 300, {from: accounts[1]});
        //     await dcc.addCoreCourse(250, 333, {from: accounts[1]});
        //     await dcc.addCoreCourse(486, 367, {from: accounts[1]});
        //     await dcc.addCoreCourse(487, 367, {from: accounts[1]});
        //     await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
        //     await dcc.addCapstoneCourse(499, 333, {from: accounts[1]});
        //     let result = await dcc.checkEligibility(123456789, {from: accounts[1]});
        //     // Final GPA = 357
        //     truffleAssert.eventEmitted(result, 'GPA', ev => {
        //         return ev.result == 357;
        //     });

        // });

        it('Success on run with 3 concurrent users.', async ()=>{
            // Register
            await dcc.registerStudent(123456789, {from: accounts[1]});
            await dcc.registerStudent(987654321, {from: accounts[2]});
            await dcc.registerStudent(112358132, {from: accounts[3]});

            // Student 1
            await dcc.addPreRequisiteCourse(115, 400, {from: accounts[1]});
            await dcc.addPreRequisiteCourse(116, 300, {from: accounts[1]});
            await dcc.addCoreCourse(250, 333, {from: accounts[1]});
            await dcc.addCoreCourse(486, 367, {from: accounts[1]});
            await dcc.addCoreCourse(487, 367, {from: accounts[1]});
            await dcc.addDomainSpecificCourse(460, 400, {from: accounts[1]});
            await dcc.addCapstoneCourse(499, 333, {from: accounts[1]});

            // Student 2
            await dcc.addPreRequisiteCourse(115, 300, {from: accounts[2]});
            await dcc.addPreRequisiteCourse(116, 400, {from: accounts[2]});
            await dcc.addCoreCourse(250, 233, {from: accounts[2]});
            await dcc.addCoreCourse(486, 267, {from: accounts[2]});
            await dcc.addCoreCourse(487, 367, {from: accounts[2]});
            await dcc.addDomainSpecificCourse(460, 200, {from: accounts[2]});
            await dcc.addCapstoneCourse(499, 200, {from: accounts[2]});
            
            // Student 3
            await dcc.addPreRequisiteCourse(115, 200, {from: accounts[3]});
            await dcc.addPreRequisiteCourse(116, 300, {from: accounts[3]});
            await dcc.addCoreCourse(250, 233, {from: accounts[3]});
            await dcc.addCoreCourse(486, 267, {from: accounts[3]});
            await dcc.addCoreCourse(487, 167, {from: accounts[3]});
            await dcc.addDomainSpecificCourse(460, 200, {from: accounts[3]});
            await dcc.addCapstoneCourse(499, 200, {from: accounts[3]});

            let result1 = await dcc.checkEligibility(123456789, {from: accounts[1]});
            // Final GPA = 357
            truffleAssert.eventEmitted(result1, 'GPA', ev => {
                return ev.result == 357;
            });
            truffleAssert.eventEmitted(result1, 'GPARequirementSatisfied', null);

            let result2 = await dcc.checkEligibility(987654321, {from: accounts[2]});
            // Final GPA = 281
            truffleAssert.eventEmitted(result2, 'GPA', ev => {
                return ev.result == 281;
            });
            truffleAssert.eventEmitted(result2, 'GPARequirementSatisfied', null);

            let result3 = await dcc.checkEligibility(112358132, {from: accounts[3]});
            // Final GPA = 223
            truffleAssert.eventEmitted(result3, 'GPA', ev => {
                return ev.result == 223;
            });
            truffleAssert.eventNotEmitted(result3, 'GPARequirementSatisfied', null);
        });
    });

});