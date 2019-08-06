
# Information Security and Quality Assurance Projects - Stock Price Checker

## _User stories_

1. Set the content security policies to only allow loading of scripts and css from your server.
2. I can GET /api/stock-prices with form data containing a Nasdaq stock ticker and receive back an object stockData.
3. In stockData, I can see the stock(string, the ticker), price(decimal in string format), and likes(int).
4. I can also pass along field like as true(boolean) to have my like added to the stock(s). Only 1 like per ip should be accepted.
5. If I pass along 2 stocks, the return object will be an array with both stock's info but instead of likes, it will display rel_likes(the difference between the likes on both) on both.
6. All 5 functional tests are complete and passing.

#### Example usage:
    - /api/stock-prices?stock=goog
    - /api/stock-prices?stock=goog&like=true
    - /api/stock-prices?stock=goog&stock=msft
    - /api/stock-prices?stock=goog&stock=msft&like=true

#### Example return (for success):
    - {"stockData":{"stock":"GOOG","price":"786.90","likes":1}}
    - {"stockData":[{"stock":"MSFT","price":"62.30","rel_likes":-1},{"stock":"GOOG","price":"786.90","rel_likes":1}]}

#### Example return (for failure):
    - stock "yhoo" returns "this does not appear to be a valid stock symbol"

#### Companion app to test with
- https://pricey-hugger.glitch.me/

  <br>
  -------------------------------------------------
  <br>

## _Technology and how it was used_

#### Security features (Helmet JS)
    * This challenge from FCC is not stable, using the correct policy creates console errors. The api they recommend is also not functioning.
    * Tests will only pass when run one at a time because the api is limited. 
    
    WHAT: CONTENT SECURITY POLICY
        - HOW: Prevents malicious various injections via header setting.
            - WHY: The browser has a hard time knowing what is 'good' and 'bad' code so you need to specify what and where code should come from via a whitelist. Attack vectors include JavaScript, CSS, Plugins, etc. Nastiest and most common is cross-site scripting (XSS).
    
#### Back-End features (Node + Express)
    - Use Node-Fetch library and Async/Await function to process external api calls. Stock info was from https://www.alphavantage.co. 
    
#### Front-End features (HTML + AJAX + BOOTSTRAP)

    - Front-End > Back-End communication via AJAX requests for dynamic data generation.
    - Responsive design via HTML and mobile first Bootstrap library. 
    
#### Database

    - MongoDB managed in the cloud via https://www.mongodb.com/cloud.
    - Mongoose ODM (Object Document Mapper) used to make DB interactions more graceful. 
    - Tracked IP in DB so that user can't like stock multiple times.
    
#### Test (Mocha + Chai)

    - Basic API tests written with Chai assertion library & Mocha testing framework.

#### Notes:
    .env file is not included in repo, need to add with below code.

    AV_KEY=EXTERNAL_STOCK_API_KEY
    DB=SECRETKEY_URI_DB
    NODE_ENV=notest