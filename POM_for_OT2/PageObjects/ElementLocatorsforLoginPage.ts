import {ElementFinder, element, by} from 'protractor';


export class LoginPage {

username:ElementFinder;
nextButton:ElementFinder;
password:ElementFinder;
signinButton:ElementFinder;
otpfield:ElementFinder;
otpverify:ElementFinder;
continueButton:ElementFinder;
candidateicon:ElementFinder;

constructor(){
    this.username= element(by.css("input[placeholder='Email address']"));
    this.nextButton= element(by.css("input[value='Next']"));
    this.password= element(by.css("input[placeholder='Password']"));
    this.signinButton=element(by.id('submitButton'));
    this.otpfield=element(by.id('idTxtBx_SAOTCC_OTC'));
    this.otpverify=element(by.css("input[value='Verify']"));
    this.continueButton=element(by.css("input[value='Yes']"));
    this.candidateicon=element(by.id('ga_candidates'));

}

}