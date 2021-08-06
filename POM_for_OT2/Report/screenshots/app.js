var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "This test case will verify the login functionality|OT2 Regression suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 3176,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624802214781,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624802219429,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=acdbf0dc-a955-4324-9471-687fb60bb1f2&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAdNiNtIzsFJJTTI1NjEzMtE1S05K1jVJTbbQtTQ2tdC1sDQ3TDFNSTEwNjcoEuISuPPh9prQlSrOUwoz6rdxb_y0itEqo6SkoNhKXz-_JLE4M7EktbhELyOxslgvOT9XL7FUPz8vtSS_NDnDSD-xtCQjNa8kMzmxJDM_Tz-xagcj4wVGxheMjKuYeFJS0xJLc0r88vOSU28x8fs7AhUbgYj8osyq1E9MnGn5RbnxBfnFJauYVQwgwFgXREKIZBgLBjYxqxhZJJoBkbmuUWIq0FMmyYm6lokpabpmRklJFqlJQJ-aGJxilssvSM3LTFEoKMpPy8xJVUjNTczMUSgtTi3SK0pNTHnEzJdVmV-S6QDz1AUWxlcsPAbMVhwcXAIMEgwKDD9YGBexAgMngPN9nrxwvWOPX5dtxbdAhlOs-mbahvn-kZaZlUUGQUGlPskelZZ53m5RZWFe5qGV2qn-Kb5paaGGgaWWFZ62ZlaGE9jYPrAxdrAz7OKkIFxvcYkYGRgZ6hqY6RqZKxgaW5maW5maRR3gZQAA0&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624802227259,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624802228034,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://otasiatest.hays.com.au/onetouch2/javascript/azure.js?version=2.3 26 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1624802254191,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/s/candidate/browse/candidate-list - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624802256447,
                "type": ""
            }
        ],
        "screenShotFile": "004a0021-0088-00d6-0013-00cd00f5007a.png",
        "timestamp": 1624802213760,
        "duration": 42694
    },
    {
        "description": "This test will verify ifscript is landing at OT2.0 url for selected region|OT2 Testing",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 10268,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": [
            "Failed: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\""
        ],
        "trace": [
            "Error: Error while waiting for Protractor to sync with the page: \"both angularJS testability and angular testability are undefined.  This could be either because this is a non-angular page or because your test involves client-side navigation, which can interfere with Protractor's bootstrapping.  See http://git.io/v4gXM for details\"\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\built\\browser.js:461:23\n    at ManagedPromise.invokeCallback_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)\nFrom: Task: <anonymous>\n    at pollCondition (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2195:19)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2191:7\n    at new ManagedPromise (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2190:22\n    at TaskQueue.execute_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)\nFrom: Task: <anonymous wait>\n    at scheduleWait (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2188:20)\n    at ControlFlow.wait (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2517:12)\n    at Driver.wait (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\webdriver.js:934:29)\n    at run (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\built\\browser.js:58:33)\n    at ProtractorBrowser.to.<computed> [as wait] (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\built\\browser.js:66:16)\n    at Suite.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_002.js:19:36)\n    at Generator.next (<anonymous>)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_002.js:8:71\n    at new Promise (<anonymous>)\n    at __awaiter (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_002.js:4:12)\nFrom: Task: Run it(\"This test will verify ifscript is landing at OT2.0 url for selected region\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_002.js:16:5)\n    at addSpecsToSuite (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_002.js:15:1)\n    at Module._compile (internal/modules/cjs/loader.js:1068:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1097:10)\n    at Module.load (internal/modules/cjs/loader.js:933:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:774:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "008900d4-0067-00ba-00f1-006c002c00d9.png",
        "timestamp": 1624802374629,
        "duration": 16
    },
    {
        "description": "This test case will verify the login functionality|OT2 Regression suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9640,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624802897156,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624802901944,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=f7b9cdd7-4b46-4b75-a1be-005a5e8fc0cb&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAaWQv2sUQRiGd24vZ3JEDcHCSra4KjK7s7N7-wsCFyEHISRpEosrlNmZWW_kdmfZncVk-4BoYf4FreTKVNEipE4Q0gkpJYXYKDZauiHcX-DLx8NbfM3zrujYRFGPx33H9bALPRpT6HIawNDpBzAIfZv1GUOOj4rl7tLXL5_-DDerzfen2ujZu7OLKYjGSuVlZFlSkVIQxUtljslBaVKZmqSyZMaVrOgYW6RSY54pQYkSMrNIfQLAJQDfAZi2FhlPSDVR2zKj_Kp1f2etecY3kIWo-e_WQiKL9HkuSzXVe-g2DrzhLeiszXKs93BAvOZ8iAlvpFxKYEhYAj0cxwGPG1MXneuPZM4zwYy8kImYcIOnREyMquSFWXDCvun3Xh5IJQYzqcs2-NFeRHo0P99d0h5qhva3DT7MNeOE14PDt2vLg6Pjjz_fpBva-ZzFnCfJOout_eLxPuFbG6nPg9p9OirEXlgP8YtXw72dvJ5s75blqhfZR53Orw54fUf7vPAfu151H2CEbYg8iH3DdiMURnY4Orur_QM1&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624802909494,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624802910384,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://otasiatest.hays.com.au/onetouch2/javascript/azure.js?version=2.3 26 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1624802935845,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/s/candidate/browse/candidate-list - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624802938302,
                "type": ""
            }
        ],
        "screenShotFile": "00e900b0-004d-0025-007c-00f400f700e5.png",
        "timestamp": 1624802896185,
        "duration": 42135
    },
    {
        "description": "This test will verify ifscript is landing at OT2.0 url for selected region|OT2 Testing",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 9640,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "0064007f-001a-00b4-009c-00e4004600e0.png",
        "timestamp": 1624802939017,
        "duration": 2773
    },
    {
        "description": "This test case will verify the login functionality|OT2 Regression suite",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8388,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624803092490,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624803096757,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=92cca412-4ce4-4153-a972-00891415859a&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAdNiNtIzsFJJTTI1NjEzMtE1S05K1jVJTbbQtTQ2tdC1sDQ3TDFNSTEwNjcoEuISEFpyZtITn2DHlUUMnSKirbNWMVpllJQUFFvp6-eXJBZnJpakFpfoZSRWFusl5-fqJZbq5-elluSXJmcY6SeWlmSk5pVkJieWZObn6SdW7WBkvMDI-IKRcRUTT0pqWmJpTolffl5y6i0mfn9HoGIjEJFflFmV-omJMy2_KDe-IL-4ZBWzigEEGOuCSAiRDGPBwCZmFSOLRDMgMtc1SkwFesokOVHXMjElTdfMKCnJIjUJ6FMTg1PMcvkFqXmZKQoFRflpmTmpCqm5iZk5CqXFqUV6RamJKY-Y-bIq80syHWCeusDC-IqFx4DZioODS4BBgkGB4QcL4yJWYODoHHlbkrHvqt809pKFLdbKDKdY9f1LPUvSC0IzPbKN8ixDXVLy3cr0w01C_QortMPNDTJTTKPy3SodvX0jUgJtja0MJ7CxfWBj7GBn2MVJQbje4hIxMjAy1DUw0zUyVzA0sTI0sjI2jjrAywAA0&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624803104716,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624803105761,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://otasiatest.hays.com.au/onetouch2/javascript/azure.js?version=2.3 26 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1624803131358,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/s/candidate/browse/candidate-list - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624803134217,
                "type": ""
            }
        ],
        "screenShotFile": "00ba00cc-00ba-0028-007a-002c004500af.png",
        "timestamp": 1624803091532,
        "duration": 42690
    },
    {
        "description": "This test will verify ifscript is landing at OT2.0 url for selected region|OT2 Testing",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 8388,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "004500f9-0000-004e-00fa-00d30094001b.png",
        "timestamp": 1624803135082,
        "duration": 2248
    },
    {
        "description": "This test case will verify the login functionality|OT2 Testing TC_001",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 17484,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": [
            "TimeoutError: Wait timed out after 10011ms"
        ],
        "trace": [
            "TimeoutError: Wait timed out after 10011ms\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)\nFrom: Task: <anonymous wait>\n    at scheduleWait (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2188:20)\n    at ControlFlow.wait (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2517:12)\n    at Driver.wait (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\webdriver.js:934:29)\n    at run (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\built\\browser.js:58:33)\n    at ProtractorBrowser.to.<computed> [as wait] (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\built\\browser.js:66:16)\n    at Suite.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_001.js:35:34)\n    at Generator.next (<anonymous>)\n    at fulfilled (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\TC_001.js:5:58)\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624803355508,
                "type": ""
            }
        ],
        "screenShotFile": "006e0042-00b6-00d8-000a-00050030007e.png",
        "timestamp": 1624803352069,
        "duration": 49973
    },
    {
        "description": "This test will verify ifscript is landing at OT2.0 url for selected region|OT2 Testing TC_002",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 17484,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00560080-005a-0066-000a-0018001900d1.png",
        "timestamp": 1624803402234,
        "duration": 10019
    },
    {
        "description": "Will take input from user|This will help us to know the region",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 16544,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": [
            "Failed: prompt is not defined"
        ],
        "trace": [
            "ReferenceError: prompt is not defined\n    at UserContext.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\GatherURLInfo.js:5:26)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)\nFrom: Task: Run it(\"Will take input from user\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\GatherURLInfo.js:3:5)\n    at addSpecsToSuite (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\91805\\Desktop\\POM_for_OT2\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\91805\\Desktop\\POM_for_OT2\\JSFile\\TestCases\\GatherURLInfo.js:2:1)\n    at Module._compile (internal/modules/cjs/loader.js:1068:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1097:10)\n    at Module.load (internal/modules/cjs/loader.js:933:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:774:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "002400bc-00ef-0061-0032-002a002c001e.png",
        "timestamp": 1624804833149,
        "duration": 8
    },
    {
        "description": "This test case will verify the login functionality|OT2 Testing TC_001",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18724,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624862167654,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624862172079,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=3d82c5ad-0c6b-41ed-a5af-d9195a285100&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAdNiNtIzsFJJTTI1NjEzMtE1S05K1jVJTbbQtTQ2tdC1sDQ3TDFNSTEwNjcoEuISWHu0yTab563j0vU3JaM0AhlWMVpllJQUFFvp6-eXJBZnJpakFpfoZSRWFusl5-fqJZbq5-elluSXJmcY6SeWlmSk5pVkJieWZObn6SdW7WBkvMDI-IKRcRUTT0pqWmJpTolffl5y6i0mfn9HoGIjEJFflFmV-omJMy2_KDe-IL-4ZBWzigEEGOuCSAiRDGPBwCZmFSOLRDMgMtc1SkwFesokOVHXMjElTdfMKCnJIjUJ6FMTg1PMcvkFqXmZKQoFRflpmTmpCqm5iZk5CqXFqUV6RamJKY-Y-bIq80syHWCeusDC-IqFx4DZioODS4BBgkGB4QcL4yJWYOBM_Fp93U8-y69zAcuiNRP1GE6x6idFemoXVxaEBJX5VSWbBZlHlQT7OeaZZOd7BIRl5wflRXg4p5gYaKcmOhrYmlsZTmBj-8DG2MHOsIuTgnC9xSViZGBkqGtgpmtkoWBgZmVsbmVgGXWAlwEA0&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624862180300,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624862181450,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://otasiatest.hays.com.au/onetouch2/javascript/azure.js?version=2.3 26 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1624862207626,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/s/candidate/browse/candidate-list - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624862210028,
                "type": ""
            }
        ],
        "screenShotFile": "003600fe-0037-00b0-0070-00fa00e200e9.png",
        "timestamp": 1624862166089,
        "duration": 43949
    },
    {
        "description": "This test case will verify the login functionality|OT2 Testing TC_001",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 432,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624865145662,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624865150045,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=654d2b03-f079-4a75-a530-503bfc1d9735&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAdNiNtIzsFJJTTI1NjEzMtE1S05K1jVJTbbQtTQ2tdC1sDQ3TDFNSTEwNjcoEuISYNb2Ta38UOq11CDA-o_sdNNVjFYZJSUFxVb6-vklicWZiSWpxSV6GYmVxXrJ-bl6iaX6-XmpJfmlyRlG-omlJRmpeSWZyYklmfl5-olVOxgZLzAyvmBkXMXEk5KalliaU-KXn5eceouJ398RqNgIROQXZValfmLiTMsvyo0vyC8uWcWsYgABxrogEkIkw1gwsIlZxcgi0QyIzHWNElOBnjJJTtS1TExJ0zUzSkqySE0C-tTE4BSzXH5Bal5mikJBUX5aZk6qQmpuYmaOQmlxapFeUWpiyiNmvqzK_JJMB5inLrAwvmLhMWC24uDgEmCQYFBg-MHCuIgVGDiLDjnMjb1c7NZuPWXjC3c9hlOs-mmVKamhhmaVnkHm2f7ZJaHlkQEFzsm-SRVmZgGh5YWm4UnloUEh5aWpRZG25laGE9jYPrAxdrAz7OKkIFxvcYkYGRgZ6hqY6RpZKBiYWxmZWZmYRx3gZQAA0&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624865158138,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624865159220,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://otasiatest.hays.com.au/onetouch2/javascript/azure.js?version=2.3 26 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1624865182345,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/s/candidate/browse/candidate-list - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624865182345,
                "type": ""
            }
        ],
        "screenShotFile": "00a3001b-0096-003d-0083-0027005800c9.png",
        "timestamp": 1624865144697,
        "duration": 37859
    },
    {
        "description": "This test case will verify the login functionality|OT2 Testing TC_001",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 4292,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624982438304,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624982442422,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=d09a4dbe-8b86-40cc-9751-c77e2ce8baff&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAaWQvUscQQDFd27PUy8mSkiRQuIGrgrO7s647hcIXhEIHBpNkahNmJmdZUf3do7dWRKvSCmCjaQJWAZS5EorURC7wGFxtaWVWIVU6cyJ3F-Qx-PHK17z3isdm3bYiCIUMR67cDHwKXQCRiFlLoUY-4sLbux5XhDlT-sz5ytHg72Dy-Vv67--zN-c3vVAmCjVKULLkooUgiheKDMhu4XJZNskpSUzrmTJEmyRUiU8U4IRJWRmke4JAAMAbgDoVaYiHpMyVasyY_yqMv22OSzje8hcdPmfymQs8_bHjixUT2_YD1qA93wAG6WRjvUG9ok7tAcx4Qw6DiMwIFEMXUypzymjzLH7-gvZ4ZmIjE4uY5Fyg7eJSI2y4LmZcxJd60-2d6USy6NRgyq4rU7ZejgxUZ_RnmuG9rcKvo8Nz_H7Z7P8qP36x8uvPx_dzWn9MSul6JP3vpU3g1Wy8TkNnHeitekm3ZU328X6Jtr5sNVCGVprdqlc8kJ0WKv9roH9ce108j9-vao_wzZG0HYhDgzkhjYKHXvr4rH2Dw2&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624982450490,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624982451331,
                "type": ""
            }
        ],
        "timestamp": 1624982437164,
        "duration": 49008
    },
    {
        "description": "This test case will verify the login functionality|OT2 Testing TC_001",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 16916,
        "browser": {
            "name": "chrome",
            "version": "91.0.4472.124"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/ns/login - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624982894377,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://login.microsoftonline.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624982899203,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sts2.hays.com/adfs/ls/?client-request-id=9c6ec2f4-1377-4dab-aa42-6151fdf648b7&wa=wsignin1.0&wtrealm=urn%3afederation%3aMicrosoftOnline&wctx=LoginOptions%3D3%26estsredirect%3d2%26estsrequest%3drQIIAaWQO2sUURzF587srskSNRiLVGGKrYQ7j5vdeUFAt8gayCoqIcRG_vcxzsTducPMnWjyCSzzAVKFVJMujWIVUqZKE4uUViIWIiI2ghvCfgIPhx-nOM05DwxiOVGHc5czEXu4FwYUd0NGMWUexYQEvWUv9n0_5MW99vyvs-zg7cLxsO7Ds7-_H3-oUZQolZeRbUsFZQpKlMpKYLe0mBxbUNkyE0pWLCE2VCoRmUoZqFRmNux9ROgCoa8I1focFzFUI_VEZkxc6XefPpqUyTVkke6Jn_psLIvxq1yWqjY6zo2W8TVvwKZpqhOjQwLwJvYxAcFwt8sAh8Bj7BFKA0EZZV3n3FiSuchSbuaFjNORMMUY0pFZlaKwCgH8i3Fne1eq9OF01EUDfWvMOUY0M9Oe1xY1U_vTQIfNyTn6Yg3fP_f6R81LvK1T7bxpZzvDnap8Yb95t7lFh-6qB_FIbnF4zQfJ8821wcCv-mt8fSPfCFaCyN1vtX600Ptb2qfZ__j1qn2fOMTFjodJaLpe5ISR6788va39Aw2&cbcxt=&username=jyoti%40hays.com&mkt=&lc= 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1624982906946,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sts2.hays.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1624982907924,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://otasiatest.hays.com.au/onetouch2/javascript/azure.js?version=2.6 28 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1624982932520,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://otasiatest.hays.com.au/hays/recruiter/SG/en/all/onetouch/s/candidate/browse/candidate-list - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1624982933908,
                "type": ""
            }
        ],
        "screenShotFile": "00ae0080-00af-003a-0048-002200e70082.png",
        "timestamp": 1624982893434,
        "duration": 40493
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
