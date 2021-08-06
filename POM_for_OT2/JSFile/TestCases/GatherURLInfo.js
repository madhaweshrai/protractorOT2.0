"use strict";
describe("This will help us to know the region", function () {
    it("Will take input from user", function () {
        let message = require('prompt-sync')();
        let regionName = prompt('Please enter the region name for which you want to perform testing');
        console.log('Hey there you have selected' + regionName);
    });
});
