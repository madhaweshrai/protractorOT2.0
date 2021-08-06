"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomePage = void 0;
const protractor_1 = require("protractor");
class HomePage {
    constructor() {
        this.homeicon = protractor_1.element(protractor_1.by.id('ga_home'));
        this.candidate = protractor_1.element(protractor_1.by.id('ga_candidates'));
        this.client = protractor_1.element(protractor_1.by.css("[id*='clients']"));
        this.job = protractor_1.element(protractor_1.by.id('ga_assignment'));
        this.org = protractor_1.element(protractor_1.by.id('ga_organisations'));
        this.site = protractor_1.element(protractor_1.by.id('ga_sitesummarytab'));
        this.Journal = protractor_1.element(protractor_1.by.id('ga_journals'));
    }
}
exports.HomePage = HomePage;
