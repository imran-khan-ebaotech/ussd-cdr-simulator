const { json } = require('body-parser')
const express = require('express')
const db = require('../config/database')
const lifeService = require('../service/life.service');


const router = express.Router()

router.get('/test', (req, res) => {
  res.json({
    message: 'cdr is working'
  })
})

router.post('/', (req, res) => {
  // Extract info from request
  let text = req.body.text;
  let accountNo = req.body.accountNo;

  let waitAPI = false;

  let response = {
    message: "",
  }

  // load account
  let account = db.get('accounts').find({ accountNo: accountNo }).value();
  if (!account) {
    account = generateNewAccount(accountNo);
    db.get('accounts')
      .push(account)
      .write();
  }

  // PROCESS CDR ---------------------

  let amount = parseInt(text);

  if (account.enrolled) {
    waitAPI = true;
    lifeService.rechargeAccount(amount, account)
      .then(policy => {
        response.message = `Your balance has been added successfully. Your aYo premium has been deducted and allocated to your policy according to your settings. Your total policy premium is now ${policy.itemResult.nextTotalPremium}. Your policy number is ${policy.policyNumber}.`;
        res.json(response);
      })
      .catch(error => {
        response.message = error;
        res.json(response);
      });
  } else {
    response.message = "You do not have aYo insurance. Your balance has been added successfully."
  }

  // END PROCESS CDR -----------------

  // Save Account
  db.get('accounts')
    .find({ accountNo: accountNo })
    .assign(account)
    .write();

  // Set Response
  if (!waitAPI) {
    res.json(response);
  }

})

module.exports = router;