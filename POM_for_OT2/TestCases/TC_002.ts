import { browser } from "protractor";
import { protractor } from "protractor/built/ptor";
import { HomePage } from "../PageObjects/ElementlocatorsforHomePage";
import { LoginPage } from "../PageObjects/ElementLocatorsforLoginPage";
import { selecturl } from "../PageObjects/URLSelector";
describe("OT2 Testing TC_002", function(){

    it("This test will verify ifscript is landing at OT2.0 url for selected region", async()=> {
        let hp = new HomePage();
        let EC = protractor.ExpectedConditions;

        try {
            
        await browser.wait(EC.visibilityOf(hp.homeicon),10000);
        await console.log("I am sucessfully landed at OT2 Home Page");
        await hp.client.click();
        await browser.wait(EC.urlContains("onetouch/s/contact/browse/contact-list?"));
        await console.log("Client entity is accessible");

        await hp.candidate.click();
        await browser.wait(EC.urlContains("onetouch/s/candidate/browse/candidate-list?"));
        await console.log("Candidate entity is accessible");

        await hp.job.click();
        await browser.wait(EC.urlContains("onetouch/s/job/browse/job-list?"));
        await console.log("Job entity is accessible");

        await hp.org.click();
        await browser.wait(EC.urlContains("onetouch/s/organisation/browse/client-list?"));
        await console.log("Org entity is accessible");

        await hp.site.click();
        await browser.wait(EC.urlContains("onetouch/s/site/browse/site-list?"));
        await console.log("Site entity is accessible");

        await hp.Journal.click();
        await browser.wait(EC.urlContains("onetouch/s/journal"));
        await console.log("Journal entity is accessible");

    }
    
    catch (error) {

        console.log(error);
            
    }

    })


})