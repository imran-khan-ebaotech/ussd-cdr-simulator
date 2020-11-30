const axios = require('axios').default;
const db = require('../config/database');
const baseUrl = "https://demo-li.insuremo.com";

const LifeService = {

    registerUser: (account) => {

        let coverages = [
            {
                "coverageSeriaId": 1,
                "chargePeriod": "1",
                "chargeYear": 0,
                "coveragePeriod": "1",
                "coverageYear": 0,
                "productCode": "DUMMYMAIN",
                "currentPremium": {
                    "paymentFreq": "5",
                    "sumAssured": 0,
                    "unit": 1
                },
                "insureds": [
                    {
                        "orderId": 1,
                        "partySerialId": 1
                    }
                ]
            }
        ]

        let randomInt1 = Math.floor(Math.random() * 99999);

        let request = {
            "clientRequestId": `AYOMAIN${randomInt1}`,
            "clientRequestTime": "2020-11-26T15:29:41",
            "policy": {
                "applyDate": "2020-11-26T00:00:00",
                "currency": 4,
                "quotationCode": `AYOMAIN${randomInt1}`,
                "serviceAgentCode": "001",
                "salesChannelCode": "eBao",
                "insurerCode": "eBao",
                "issueDate": "2020-11-01T00:00:00.000+0800",
                "customers": [
                    {
                        "partySerialId": 1,
                        "partyType": "1",
                        "person": {
                            "gender": account.gender,
                            "birthdate": account.dob,
                            "certiType": 9,
                            "certiCode": "IDAYO" + randomInt1,
                            "firstName": account.firstName,
                            "middleName": "",
                            "lastName": account.lastName,
                            "nationality": "7",
                            "occupationCode": 2,
                            "occupation": "Actor",
                            "employerInfo": "eBaotech"
                        },
                        "organization": {
                            "registerType": 1001,
                            "registerCode": "1001",
                            "countryCode": 156,
                            "companyName": "eBaotech"
                        },
                        "partyContact": {
                            "mobileTel": "+8511",
                            "email": "likun.lv@ebaotech.com"
                        },
                        "address": {
                            "address1": "Shanghai",
                            "address2": "Shanghai",
                            "address3": "yangpu resident",
                            "address4": "songhu road",
                            "postCode": "200433"
                        }
                    },
                    {
                        "partySerialId": 3,
                        "partyType": "1",
                        "person": {
                            "gender": "M",
                            "birthdate": "2001-01-09T00:00:00",
                            "certiType": 3,
                            "certiCode": "BENE_IDAYO" + randomInt1,
                            "firstName": account.firstName,
                            "middleName": "M",
                            "lastName": account.lastName,
                            "nationality": "7"
                        }
                    }
                ],
                "coverages": coverages,
                "policyHolder": {
                    "partySerialId": 1,
                    "relationToLA": 1
                },
                "insureds": [
                    {
                        "partySerialId": 1,
                        "relationToPH": 1
                    }
                ],
                "beneficiaries": [
                    {
                        "partySerialId": 3,
                        "insuredPartySerialId": 1,
                        "beneType": "1",
                        "designation": 1,
                        "shareOrder": 1,
                        "shareRate": 1
                    }
                ],
                "payers": [
                    {
                        "partySerialId": 1,
                        "relationToPH": 1,
                        "shareRate": 1
                    }
                ],
                "payerAccounts": [
                    {
                        "paymentMethod": 1,
                        "paymentMethodNext": 1
                    }
                ],
                "trustees": [],
                "declarations": [],
                "agentDeclarations": []
            },
            "collection": {
                "collectionDate": "2020-11-26T15:29:41",
                "payMode": 1,
                "currency": 4,
                "feeAmount": 0
            }
        }

        return new Promise((resolve, reject) => {
            axios.post(`${baseUrl}/proposal/proposals`, request, {
                headers: {
                    'X-ebao-tenant-id': 'eBao',
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {
                    account.certiCode = "IDAYO" + randomInt1;
                    account.certiType = 9;

                    if (response.data.policy) {
                        let policyNumber = response.data.policy.policyNumber;
                        account.policyNumber = policyNumber;
                        console.log("Policy Number: " + policyNumber);
                    }

                    if (response.data.customersInfo) {
                        let customerNo = response.data.customersInfo[0].customerNo;
                        account.customerNo = customerNo;
                        console.log("Customer Number: " + customerNo);
                    }

                    // Save Account
                    db.get('accounts')
                        .find({ accountNo: account.accountNo })
                        .assign(account)
                        .write();

                    resolve(response.data);
                })
                .catch(error => {
                    console.log(error);
                    reject(error.response.data.messages[0].message);
                })
        })

    },

    getPolicyDetails: (account) => {
        return new Promise((resolve, reject) => {
            axios.get(`${baseUrl}/policy/policies/eBao/${account.policyNumber}`, {
                headers: {
                    'X-ebao-tenant-id': 'eBao',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error.response.data.messages[0].message)
                })
        });
    },

    rechargeAccount: (amount, account) => {

        let coverages = [];
        let feeAmount = 0;

        if (account.enrollmentType.includes('MyLife')) {
            feeAmount += Math.floor(amount * 0.1);
            coverages.push({
                "coverageSerialId": 1,
                "deferPeriod": 0,
                "mortgageRepayMethod": 0,
                "chargePeriod": 1,
                "chargeYear": 0,
                "coveragePeriod": 1,
                "coverageYear": 0,
                "productCode": "MYLIFES",
                "insuredCategory": 0,
                "waiverExt": {
                    "isWaiver": "N",
                    "waivedSa": 0
                },
                "currentPremium": {
                    "paymentFreq": 5,
                    "sumAssured": Math.floor(amount * 0.1) * 100,
                    "premium": Math.floor(amount * 0.1),
                    "unit": 0
                },
                "coverageAgents": [
                    {
                        "agentCode": "001",
                        "assignRate": 1
                    }
                ],
                "payPlans": [],
                "insureds": [
                    {
                        "customerNo": account.customerNo,
                        "orderId": 1
                    }
                ],
                "premInvestRates": []
            })
        }

        if (account.enrollmentType.includes('MyHospital')) {
            feeAmount += Math.floor(amount * 0.1);
            coverages.push({
                "coverageSerialId": 3,
                "deferPeriod": 0,
                "mortgageRepayMethod": 0,
                "chargePeriod": 1,
                "chargeYear": 0,
                "coveragePeriod": 1,
                "coverageYear": 0,
                "productCode": "MYHOSPITALS",
                "insuredCategory": 0,
                "waiverExt": {
                    "isWaiver": "N",
                    "waivedSa": 0
                },
                "currentPremium": {
                    "paymentFreq": 5,
                    "sumAssured": Math.floor(amount * 0.1) * 100,
                    "premium": Math.floor(amount * 0.1),
                    "unit": 0
                },
                "coverageAgents": [
                    {
                        "agentCode": "001",
                        "assignRate": 1
                    }
                ],
                "payPlans": [],
                "insureds": [
                    {
                        "customerNo": account.customerNo,
                        "orderId": 1
                    }
                ],
                "premInvestRates": []
            })
        }

        let randomInt1 = Math.floor(Math.random() * 99999);

        let request = {
            "clientRequestId": "AYOADDML" + randomInt1,
            "clientRequestTime": "2020-11-26T14:54:7",
            "policyNumber": account.policyNumber,
            "submissionDate": "2020-11-26T00:00:00",
            "effectiveDate": "2020-11-26T00:00:00",
            "item": {
                "autoFillTermWithMain": true,
                "coverages": coverages
            },
            "collection": {
                "collectionDate": "2020-11-26T14:54:7",
                "payMode": 1,
                "currency": 4,
                "feeAmount": feeAmount
            }
        }

        return new Promise((resolve, reject) => {
            axios.post(`${baseUrl}/policy/policy-alterations/eBao/addrider`, request, {
                headers: {
                    'X-ebao-tenant-id': 'eBao',
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {
                    resolve(response.data);
                })
                .catch(error => {
                    console.log(error);
                    reject(error.response.data.messages[0].message);
                })
        })

    },

    startClaim: (detail, account) => {

        let randomInt1 = Math.floor(Math.random() * 99999);

        let request = {
            "clientRequestId": "AYOCLM" + randomInt1,
            "clientRequestTime": "2020-11-30T10:20:54",
            "policyNumber": account.policyNumber,
            "claimant": {
               "name": account.firstName,
               "partyContact": {
                  "email": account.email,
                  "mobile": account.mobile
                  }
             },
             "insured": {
               "name": account.firstName,
               "gender": account.gender,
               "certiType": account.certiType,
               "certiCode": account.certiCode
             },
             "relationToInsured": 7,
             "event": {
               "reportType": 1,
               "eventNature": 2,
               "eventTime": "2020-11-30T10:20:54",
               "eventDetail": detail,
               "eventLocation": "Kampala"
             },
            "documents": [{
               "type": "00014",
               "path": "string"
             }],
           "claimType": 2
         }

         console.log(request);

         return new Promise((resolve, reject) => {
            axios.post(`${baseUrl}/claimsurface/claim/eBao/register`, request, {
                headers: {
                    'X-ebao-tenant-id': 'eBao',
                    'Content-Type': 'application/json'
                }
            })
                .then((response) => {

                    if (response.data.claimCaseNo) {
                        account.claimCaseNo = response.data.claimCaseNo;
                        console.log("Claim case no: " + response.data.claimCaseNo);
                    }

                    // Save Account
                    db.get('accounts')
                        .find({ accountNo: account.accountNo })
                        .assign(account)
                        .write();

                    resolve(response.data);
                })
                .catch(error => {
                    console.log(error.response.data.exceptions);
                    reject(error.response.data.exceptions[0]);
                })
        })

    }

}

module.exports = LifeService;
