## Steps for running tests for Milestone 1
1. Ensure that node.js is installed
2. Run ```npm install``` in the root directory where the repo is installed
3. Run the following command below
```
cd client
npm install
cd ..
```
4. Modify the .env file in the following format (Modify the fields in inverted commas):
```
PORT = 6060
DEV_MODE = development
MONGO_URL = "Your Mongodb url"
JWT_SECRET = "Your jwt secret"
BRAINTREE_MERCHANT_ID = "Your braintree merchant id"
BRAINTREE_PUBLIC_KEY = "Your braintree public key"
BRAINTREE_PRIVATE_KEY = "Your braintree private key"

```
5. To run the application, run ```npm run dev```
6. To run the all the tests in the frontend, run ```npm run test:frontend```
7. To run the all the tests in the backend, run ```npm run test:backend```
8. To run a specific test in the backend, modify the `testmatch` field in jest.backend.config.js to point to the path of the test file and run ```npm run test:backend```.

For example, if we only want to run the register controller test, we can modify `testmatch` as follows:
```
  testMatch: ["<rootDir>/controllers/tests/registerController.test.js"]
```

9. Similarly, to run a specific test in the frontend, modify the `testmatch` field in jest.frontend.config.js to point to the path of the test file and run ```npm run test:frontend```.


### [CI/CD LINK](https://github.com/cs4218/cs4218-2420-ecom-project-team14/actions/runs/13755269997/job/38461615202)