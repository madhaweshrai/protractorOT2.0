import {ElementFinder, element, by} from 'protractor';

export class HomePage{

    homeicon:ElementFinder;
    candidate:ElementFinder;
    client:ElementFinder;
    job:ElementFinder;
    org:ElementFinder;
    site:ElementFinder;
    Journal:ElementFinder;

    constructor(){
        this.homeicon=element(by.id('ga_home'));
        this.candidate=element(by.id('ga_candidates'));
        this.client=element(by.css("[id*='clients']"));
        this.job=element(by.id('ga_assignment'));
        this.org=element(by.id('ga_organisations'));
        this.site=element(by.id('ga_sitesummarytab'));
        this.Journal=element(by.id('ga_journals'))
    }
    
}