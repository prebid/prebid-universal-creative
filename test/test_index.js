var testsContext = require.context('.', true, /_spec\.js$/);
testsContext.keys().forEach(testsContext);
