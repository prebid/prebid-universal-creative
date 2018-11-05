**Table of Contents**
- [Release Process](#release-process)

## Release Process

_Note: If `github.com/prebid/prebid-universal-creative` is not configured as the git origin for your repo, all of the following git commands will have to be modified to reference the proper remote (e.g. `upstream`)_

1. Make Sure all browserstack tests are passing. On PR merge to master CircleCI will run unit tests on browserstack. Checking the last CircleCI build [here](https://circleci.com/gh/prebid/prebid-universal-creative) for master branch will show you detailed results. 
  
   In case of failure do following, 
     - Try to fix the failing tests.
     - If you are not able to fix tests in time. Skip the test, create issue and tag contributor.

   #### How to run tests in browserstack
   
   _Note: the following browserstack information is only relevant for debugging purposes, if you will not be debugging then it can be skipped._

   Set the environment variables. You may want to add these to your `~/.bashrc` for convenience.

   ```
   export BROWSERSTACK_USERNAME="my browserstack username"
   export BROWSERSTACK_ACCESS_KEY="my browserstack access key"
   ```
   
   ```
   gulp test --browserstack >> prebid_uc_test.log
   
   vim prebid_uc_test.log // Will show the test results
   ```


2. Prepare Prebid Code

   Update the package.json version to become the current release. Then commit your changes.

   ```
   git commit -m "Prebid Universal Creative 1.x.x Release"
   git push
   ```

3. Verify Release

   Make sure your there are no more merges to master branch. Prebid Universal Creative code is clean and up to date.

4. Create a GitHub release

   Edit the most recent [release notes](https://github.com/prebid/prebid-universal-creative/releases) draft and make sure the correct tag is in the dropdown. Click `Publish`. GitHub will create release tag. 
   
   Pull these changes locally by running command 
   ```
   git pull
   git fetch --tags
   ``` 
   
   and verify the tag.

5. Distribute the code 

   _Note: do not go to step 6 until step 5 has been verified completed._

   Reach out to any of the Appnexus folks to trigger the jenkins job.

   // TODO 
   Jenkins job is making a new build, pushing prebid-universal-creative to npm, purging jsDelivr cache and sending notification to slack.
   Will eventually create bash script or integrate the build/deployment process with circlci to do above tasks.

6. Post Release Version
   
   Update the version
   Manually edit Prebid Universal Creative's package.json to become "1.x.x-pre" (using the values for the next release). Then commit your changes.
   ```
   git commit -m "Increment pre version"
   git push
   ```
   
7. Create new release draft

   Go to [github releases](https://github.com/prebid/prebid-universal-creative/releases) and add a new draft for the next version of Prebid Universal Creative with the following template:
```
## 🚀New Features
 
## 🛠Maintenance
 
## 🐛Bug Fixes
```