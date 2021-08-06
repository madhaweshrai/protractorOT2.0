import { browser } from "protractor";
import { protractor } from "protractor/built/ptor";
import { LoginPage } from "../PageObjects/ElementLocatorsforLoginPage";
import { selecturl } from "../PageObjects/URLSelector";
import {credential} from "../PageObjects/Credentials";

describe("OT2 Testing TC_001", function(){

    it("This test case will verify the login functionality", async()=> {

        // creating objects from another classes
        let lp = new LoginPage();
        let url = new selecturl();
        let EC = protractor.ExpectedConditions;
        let cr = new credential();

    try {

    browser.waitForAngularEnabled(false);
    browser.get(url.ASIA);
    browser.wait(EC.visibilityOf(lp.username),10000);    
    await lp.username.sendKeys(cr.username);
    await lp.nextButton.click();
    browser.wait(EC.visibilityOf(lp.password),10000);
    await lp.password.sendKeys(cr.password);
    await lp.signinButton.click(); 

    //Now I will wait till user enters the OTP   
    await browser.sleep(20000);
    await lp.otpfield.click();
    await lp.otpverify.click();
    browser.wait(EC.visibilityOf(lp.continueButton),10000);
    await lp.continueButton.click();  
    
     
    console.log("Sucessfully logged in")
      
    } 
  catch (error) {
      console.log(error);

    }
    },600000)
})