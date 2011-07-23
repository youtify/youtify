var tests = [];

function assertEquals(a, b) {
    if (a !== b) {
        throw a + ' !== ' + b;
    }
}

/** CALLBACKS **/

function start() {
}

function complete() {
}

function setup() {
}

/** GO! **/

function runTests() {
    var i = 0,
        result;

    start();

    for (i = 0; i < tests.length; i += 1) {
        setup();

        try {
            tests[i]();
            console.log('Test ' + (i+1) + '/' + tests.length + ' ... ' + 'OK'); 
        } catch (e) {
            console.error('Test ' + (i+1) + '/' + tests.length + ' ... ' + 'FAIL'); 
            console.error(e);
        }
    }

    complete();
}

