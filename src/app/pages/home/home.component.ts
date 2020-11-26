import { stringify } from '@angular/compiler/src/util';
import { Component, OnInit } from '@angular/core';
import { USSDService } from 'src/app/shared/ussd.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  accountNo = 'ACC001'
  account: any;
  amount: number;
  messages: any[];
  currentMessage = "";
  response = "";
  sessionId = null;

  rechargeDisabled = false;

  constructor(private ussdService: USSDService) { }

  ngOnInit(): void {
  }

  appendMessage(char: string) {
    this.currentMessage = this.currentMessage + char;
  }

  clearMessage() {
    this.currentMessage = "";
  }

  recharge() {
    this.response = "";
    this.rechargeDisabled = true;
    interface ussdResponse {
      message: string;
      sessionId: string;
    }

    this.ussdService.sendCDRMessage({
      accountNo: this.accountNo,
      sessionId: this.sessionId,
      text: this.currentMessage
    }).subscribe(
      (result: ussdResponse) => {
        this.response = result.message;
        this.sessionId = result.sessionId;
        this.rechargeDisabled = false;
      },
      error => {
        this.rechargeDisabled = false;
        console.log(error);
      }
    )
  }

  dial() {
    this.response = "";

    interface ussdResponse {
      message: string;
      sessionId: string;
    }

    this.ussdService.sendUSSDMessage({
      accountNo: this.accountNo,
      sessionId: this.sessionId,
      text: this.currentMessage
    }).subscribe(
      (result: ussdResponse) => {
        this.response = result.message;
        this.sessionId = result.sessionId;
      },
      error => {
        console.log(error);
      }
    )
  }

}
