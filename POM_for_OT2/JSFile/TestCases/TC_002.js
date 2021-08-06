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
const ElementlocatorsforHomePage_1 = require("../PageObjects/ElementlocatorsforHomePage");
describe("OT2 Testing TC_002", function () {
    it("This test will verify ifscript is landing at OT2.0 url for selected region", () => __awaiter(this, void 0, void 0, function* () {
        let hp = new ElementlocatorsforHomePage_1.HomePage();
        let EC = ptor_1.protractor.ExpectedConditions;
        try {
            yield protractor_1.browser.wait(EC.visibilityOf(hp.homeicon), 10000);
            yield console.log("I am sucessfully landed at OT2 Home Page");
            yield hp.client.click();
            yield protractor_1.browser.wait(EC.urlContains("onetouch/s/contact/browse/contact-list?"));
            yield console.log("Client entity is accessible");
            yield hp.candidate.click();
            yield protractor_1.browser.wait(EC.urlContains("onetouch/s/candidate/browse/candidate-list?"));
            yield console.log("Candidate entity is accessible");
            yield hp.job.click();
            yield protractor_1.browser.wait(EC.urlContains("onetouch/s/job/browse/job-list?"));
            yield console.log("Job entity is accessible");
            yield hp.org.click();
            yield protractor_1.browser.wait(EC.urlContains("onetouch/s/organisation/browse/client-list?"));
            yield console.log("Org entity is accessible");
            yield hp.site.click();
            yield protractor_1.browser.wait(EC.urlContains("onetouch/s/site/browse/site-list?"));
            yield console.log("Site entity is accessible");
            yield hp.Journal.click();
            yield protractor_1.browser.wait(EC.urlContains("onetouch/s/journal"));
            yield console.log("Journal entity is accessible");
        }
        catch (error) {
            console.log(error);
        }
    }));
});
