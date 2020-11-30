const express = require('express')
const db = require('../config/database')
const uuidv4 = require('uuid/v4');
const lifeService = require('../service/life.service');

const router = express.Router()

const randomFirstNames = ["Bob", "Bill", "John", "Jack", "James", "Jarvis", "Javed", "Jamal", "Javier", "JamJam"]
const randomLastNames = ["Burr", "Rogan", "Appleseed", "Khan", "Bon Jovi", "Klien", "Harris", "Smith", "Gladwell", "Singh"]

function generateNewAccount(AccNo) {

  let randomFirstName = randomFirstNames[Math.floor(Math.random() * 9)]
  let randomLastName = randomLastNames[Math.floor(Math.random() * 9)]

  return {
    "accountNo": AccNo,
    "policyNumber": null,
    "accountName": randomFirstName + " " + randomLastName,
    "dob": "2001-01-09T00:00:00",
    "gender": "F",
    "enrolled": false,
    "enrollmentType": null,
    "firstName": randomFirstName,
    "lastName": randomLastName,
    "nationality": "7",
    "occupationCode": 2,
    "occupation": "Actor",
    "employerInfo": "eBaoTech",
    "email": "joanna.cong@ebaotech.com",
    "mobile": "0123456789",
    "address1": "169",
    "address2": "Bombo Road Wandegeya",
    "address3": "",
    "address4": "Kampala",
    "postCode": "23203"
  }
}

router.get('/test', (req, res) => {
  res.json({
    message: 'ussd is working'
  })
})

router.get('/accounts', (req, res) => {
  const data = db.get('accounts').value()
  res.status(200).json(data)
})

router.get('/sessions', (req, res) => {
  const data = db.get('sessions').value()
  res.status(200).json(data)
})


router.post('/addAccount', (req, res) => {

  const accountNo = req.body.accountNo
  const amount = req.body.amount

  const account = db.get('accounts').find({ accountNo: accountNo }).value()
  if (account === undefined) {
    res.status(401).json({
      message: 'Account not found'
    })
    return;
  }

  const last = account.transactions.length - 1
  const id = account.transactions[last].id + 1
  const total = account.total + amount;
  const newTransactions = [...account.transactions, { id: id, amount: amount }]

  db.get('accounts')
    .find({ accountNo: accountNo })
    .assign({ total: total, transactions: newTransactions })
    .write();

  const updated = db.get('accounts').find({ accountNo: accountNo }).value()
  res.json(updated)

})

router.post('/', (req, res) => {
  // Extract info from request
  let text = req.body.text;
  let sessionId = req.body.sessionId;
  let accountNo = req.body.accountNo;
  let session = {};

  let waitAPI = false;

  let response = {
    message: "",
    sessionId: ""
  }

  // load session
  if (!sessionId) {
    sessionId = uuidv4();
    session = {
      "sessionId": sessionId,
      "accountNo": accountNo,
      "messages": []
    }
    response.sessionId = sessionId;
    db.get('sessions')
      .push(session)
      .write();
  } else {
    session = db.get('sessions')
      .find({ "sessionId": sessionId })
      .value();
  }

  // load account
  let account = db.get('accounts').find({ accountNo: accountNo }).value();
  if (!account) {
    account = generateNewAccount(accountNo);
    db.get('accounts')
      .push(account)
      .write();
  }

  if (account.enrolled) {

    if (text === '*296#*9#') {
      // Initiate Claim
      response.message = `You are making a claim on your policy. What is the reason for the claim? 1. Accident Injury 2. Accident Death`
    } else if (text === '*296#*9#*1#') {
      waitAPI = true;
      let detail = 'Accident Injury'
      lifeService.startClaim(detail, account)
        .then(claim => {
          let claimNo = claim.claimCaseNo;
          response.message = `Your claim has been successfully submitted. Your claim number is ${claimNo}`;
          res.json(response);
        })
        .catch(error => {
          response.message = `An error occured submitting your claim. Please try again later.`;
          res.json(response);
        });
    } else if (text === '*296#*9#*2#') {
      waitAPI = true;
      let detail = 'Accident Death'
      lifeService.startClaim(detail, account)
        .then(claim => {
          let claimNo = claim.claimCaseNo;
          response.message = `Your claim has been successfully submitted. Your claim number is ${claimNo}`;
          res.json(response);
        })
        .catch(error => {
          response.message = `An error occured submitting your claim. Please try again later.`;
          res.json(response);
        });
    } else {
      // Generic Account Status 
      waitAPI = true;
      lifeService.getPolicyDetails(account)
        .then(policy => {
          let MyLifeSumAssured = 0;
          let MyLifePremium = 0;
          let MyHospitalSumAssured = 0;
          let MyHospitalPremium = 0;

          policy.coverages.forEach(cov => {
            if (cov.productCode === 'MYLIFES') {
              MyLifeSumAssured = cov.currentPremium.sumAssured;
              MyLifePremium = cov.currentPremium.premium;
            }
            if (cov.productCode === 'MYHOSPITALS') {
              MyHospitalSumAssured = cov.currentPremium.sumAssured;
              MyHospitalPremium = cov.currentPremium.premium;
            }
          });

          let additionalDetails = MyLifeSumAssured ? ` MyLife premium: ${MyLifePremium} UGX, sum assured: ${MyLifeSumAssured} UGX.` : "";
          additionalDetails = additionalDetails + (MyHospitalSumAssured ? ` MyHospital premium: ${MyHospitalPremium} UGX, sum assured: ${MyHospitalSumAssured} UGX.` : "")
          response.message = `you have already registered for ${account.enrollmentType}. Your policy number is ${account.policyNumber}. ${additionalDetails}. Use *9# to initiate a claim.`

          res.json(response);
        })
        .catch(error => {
          response.message = `you have already registered for ${account.enrollmentType}. Your policy number is ${account.policyNumber}. Use *9# to initiate a claim.`
          res.json(response);
        })
    }
  } else {
    // Process Message Workflow
    if (text === '*296#') {
      response.message = `Welcome to aYo insurance ${account.accountName}, what benefits would you like to register for? \n1. MyLife \n2. MyHospital \n3. Both MyLife and MyHospital`
    }
    else if (text === '*296#*1#') {
      response.message = "You have selected to register for MyLife. When you add balance to your account 10% will be allocated toward you life insurance. Do you accept? \n1. Yes \n 2. No"
    }
    else if (text === '*296#*2#') {
      response.message = "You have selected to register for MyHospital. When you add balance to your account 10% will be allocated toward your hospital insurance. Do you accept? \n1. Yes \n 2. No"
    }
    else if (text === '*296#*3#') {
      response.message = "You have selected to register for MyHospital. When you add balance to your account 20% will be allocated toward your life and hospital insurance. Do you accept? \n1. Yes \n 2. No"
    }
    else if (text === '*296#*1#*1#') {
      account.enrolled = true;
      waitAPI = true;
      account.enrollmentType = 'MyLife';
      lifeService.registerUser(account).then(response => {
        response.message = `You have successfully registered for MyLife insurance. Your policy number is ${response.policy.policyNumber}. We will send your policy documents shortly.`
        res.json(response);
      })
        .catch(error => {
          account.enrolled = false;
          response.message = error;
          res.json(response);
        });
    }
    else if (text === '*296#*2#*1#') {
      account.enrolled = true;
      waitAPI = true;
      account.enrollmentType = 'MyHospital';
      lifeService.registerUser(account).then(response => {
        response.message = `You have successfully registered for MyLife insurance. Your policy number is ${response.policy.policyNumber}. We will send your policy documents shortly.`
        res.json(response);

      })
        .catch(error => {
          account.enrolled = false;
          response.message = error;
          res.json(response);
        });
    }
    else if (text === '*296#*3#*1#') {
      account.enrolled = true;
      waitAPI = true;
      account.enrollmentType = 'MyLife, MyHospital';
      lifeService.registerUser(account).then(response => {
        response.message = `You have successfully registered for MyLife insurance. Your policy number is ${response.policy.policyNumber}. We will send your policy documents shortly.`
        res.json(response);
      })
        .catch(error => {
          account.enrolled = false;
          response.message = error;
          res.json(response);
        });
    }
    else if (text === '*296#*1#*2#' || text === '*296#*2#*2#' || text === '*296#*3*2#') {
      response.message = "You have cancelled your aYo insurance quote."
    }
    else {
      response.message = "Invalid Code."
    }

  }

  // Save Account
  db.get('accounts')
    .find({ accountNo: accountNo })
    .assign(account)
    .write();

  // Save Session
  session = db.get('sessions')
    .find({ "sessionId": sessionId })
    .assign(session)
    .write();

  // Set Response
  if (!waitAPI) {
    res.json(response);
  }

})

module.exports = router;