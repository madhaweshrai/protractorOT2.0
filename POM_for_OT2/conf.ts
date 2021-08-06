import {Config} from 'protractor';
var HtmlReporter = require('protractor-beautiful-reporter');


export let config: Config = {
    
    directConnect:true,
    framework: 'jasmine2', 
    onPrepare: function () 
    {      
      jasmine.getEnv().addReporter(new HtmlReporter({
      baseDirectory: 'Report/screenshots'
     }).getJasmine2Reporter());
  },
    

    //seleniumAddress: 'http://localhost:4444/wd/hub',
  
    capabilities: {
      browserName: 'chrome',
      'chromeOptions': {
        args: ["--incognito"]
      }
      
    },

   /* suites: {
      regression : ['./TestCases/TC*.js'],
      sanity : ['TestCases/TC_001.js'],
      functional : ['./TestCases/TC*.js']

    },
    */

    

    specs: ['TestCases/TC_001.js'], 
   
    jasmineNodeOpts: {
      showColors: true, 
    }
  };
  