"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
const protractor_1 = require("protractor");
class LoginPage {
    constructor() {
        this.username = protractor_1.element(protractor_1.by.css("input[placeholder='Email address']"));
        this.nextButton = protractor_1.element(protractor_1.by.css("input[value='Next']"));
        this.password = protractor_1.element(protractor_1.by.css("input[placeholder='Password']"));
        this.signinButton = protractor_1.element(protractor_1.by.id('submitButton'));
        this.otpfield = protractor_1.element(protractor_1.by.id('idTxtBx_SAOTCC_OTC'));
        this.otpverify = protractor_1.element(protractor_1.by.css("input[value='Verify']"));
        this.continueButton = protractor_1.element(protractor_1.by.css("input[value='Yes']"));
        this.candidateicon = protractor_1.element(protractor_1.by.id('ga_candidates'));
    }
}
exports.LoginPage = LoginPage;
