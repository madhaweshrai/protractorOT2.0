"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
const ptor_1 = require("protractor/built/ptor");
const ElementLocatorsforLoginPage_1 = require("../PageObjects/ElementLocatorsforLoginPage");
const URLSelector_1 = require("../PageObjects/URLSelector");
const Credentials_1 = require("../PageObjects/Credentials");
describe("OT2 Testing TC_001", function () {
    it("This test case will verify the login functionality", () => __awaiter(this, void 0, void 0, function* () {
        // creating objects from another classes
        let lp = new ElementLocatorsforLoginPage_1.LoginPage();
        let url = new URLSelector_1.selecturl();
        let EC = ptor_1.protractor.ExpectedConditions;
        let cr = new Credentials_1.credential();
        try {
            protractor_1.browser.waitForAngularEnabled(false);
            protractor_1.browser.get(url.ASIA);
            protractor_1.browser.wait(EC.visibilityOf(lp.username), 10000);
            yield lp.username.sendKeys(cr.username);
            yield lp.nextButton.click();
            protractor_1.browser.wait(EC.visibilityOf(lp.password), 10000);
            yield lp.password.sendKeys(cr.password);
            yield lp.signinButton.click();
            //Now I will wait till user enters the OTP   
            yield protractor_1.browser.sleep(20000);
            yield lp.otpfield.click();
            yield lp.otpverify.click();
            protractor_1.browser.wait(EC.visibilityOf(lp.continueButton), 10000);
            yield lp.continueButton.click();
            console.log("Sucessfully logged in");
        }
        catch (error) {
            console.log(error);
        }
    }), 600000);
});
