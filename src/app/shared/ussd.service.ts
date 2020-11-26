import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root'
})
export class USSDService {

  private policies: any[]

  constructor(private http: HttpClient) { }

  sendUSSDMessage(req) {
    return this.http.post(`${environment.apiBase}/api/ussd/`, req);
  }

  sendCDRMessage(req) {
    return this.http.post(`${environment.apiBase}/api/cdr/`, req);
  }

  getPolicyDetails(policyNo: string) {
    return this.policies.find(p => p.policyNo === policyNo);
  }

  getPoliciesForAccount(accountNo: string) {
    return new Promise((resolve, reject) => {
      this.http.get(`${environment.apiBase}/api/policy/findByAccount/${accountNo}`).subscribe((policies: any[]) => {
        this.policies = policies
        resolve(this.policies)
      },
        (error) => reject(error))
    })

  }
}