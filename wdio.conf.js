exports.config = {
	specs: [
		'./test/e2e/specs/*.js'
 ],
	services: ['browserstack'],
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
	browserstackLocal: true,
	// browserstackOpts: {},
	maxInstances: 15,
	capabilities: [
		{
			browserName: 'chrome',
			platform: 'WINDOWS',
			version: '62',
			acceptSslCerts: true
		},
		{
			browserName: 'IE',
			platform: 'WINDOWS',
			version: '11',
			acceptSslCerts: true
		},
		{
			browserName: 'Edge',
			platform: 'WINDOWS',
			version: '15.0',
			acceptSslCerts: true
		}
	],
	logLevel: 'verbose',               // Level of logging verbosity: silent | verbose | command | data | result | error
	coloredLogs: true,
	waitforTimeout: 90000,            // Default timeout for all waitFor* commands.
  connectionRetryTimeout: 90000,    // Default timeout in milliseconds for request if Selenium Grid doesn't send response
	connectionRetryCount: 3,          // Default request retries count
	framework: 'mocha',
	mochaOpts: {
		ui: 'bdd',
		timeout: 90000,
		compilers: ['js:babel-register'],
	},
	reporters: ['spec']
};