/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const fetch = require('node-fetch');
var mongoose = require('mongoose');
require('dotenv').config()
var Stock = require('../schema/stock.js')

const CONNECTION_STRING = process.env.DB;

mongoose.connect(process.env.DB || 3000)

module.exports = function (app) {

  // function to fetch data based on stock symb
    async function fetchStock(sym) {
      console.log('fetching data ...', sym)
      const res = await fetch
        //compose fetch url with sym provided and key pulled from env file
        (`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${process.env.AV_KEY}`);
      const data = await res.json();
      return data
    }
  
  app.route('/api/stock-prices')
    .get(function (req, res){
  
    const current_query = {
      stock: req.query.stock,
      like: req.query.like ? 1 : 0,
      ip: req.headers['x-forwarded-for'].split(',')[0]
    };

    // single stock logic
    if (typeof current_query.stock == 'string') {
      // fetch the data from the stock api
      fetchStock(current_query.stock).then((data) => {
        
        // object to hold stock info to be referenced later
        const stock = {
          symbol: data['Global Quote']['01. symbol'],
          price: data['Global Quote']['05. price']
        };
        
        // formatted response object to return to user
        const returnObj = {
          stockData: {"stock": stock.symbol, "price": stock.price}
        };
        
        // if stock can't be found via api send back error
        if (stock.symbol == undefined) {
          res.send('this does not appear to be a valid stock symbol');
        }
        // else, the stock lookup is valid so save it to the db
        else {
          Stock.findOne({ symbol: stock.symbol }, function (err, docs) {
            // use for prod
            let current_ip = current_query.ip
            // flip var below with one above for internal testing
            //let current_ip = '1.2.3.4.5.6.7.8.9.10';

            // if stock is not in db then save it
            if (docs == null) {
              var newStock = new Stock({ symbol: stock.symbol, likes: current_query.like })
              // if the user has liked the stock then save their ip so they can't like it again
              if (current_query.like == 1) {
                newStock.ips.push(current_ip)
              }
              newStock.save()
              returnObj.stockData.likes = newStock.likes;
              res.json(returnObj)
            }
            // else, stock already in db so update it if needed
            else {
              // if user has voted for this stock previously via the current ip return it without change
              if (docs.ips.includes(current_ip)) {
                //user has liked already so just send back obj
                returnObj.stockData.likes = docs.likes;
                res.json(returnObj)
              }
              // else, check if the user wants to vote for it and update the document
              else {
                // if user has not voted for this stock yet increment and add their ip so they can't like it again
                if (current_query.like == 1) {
                  docs.ips.push(current_ip)
                }
                docs.likes = docs.likes + current_query.like
                docs.save()
                returnObj.stockData.likes = docs.likes;
                res.json(returnObj)
              } 
            } 
          });
        }
      })
        .catch((error) => { 
          console.log(error);
          console.log("API call frequency is 5 calls per minute and 500 calls per day. This causes inconsistent failures for tests resulting in the error (TypeError: Cannot read property '01. symbol' of undefined).");
          res.send('API call frequency is 5 calls per minute and 500 calls per day. It appears you reached the limit, please wait a bit and try again.');
        })  
    }
    // multi-stock logic, comparing two sends an array (current_query.stock[0] & current_query.stock[1]) not a string 
    else {
      // create vars to hold temp data as we progress through db lookups
      let returnObj = {stockData: []};  
      let tempStockOne;
      let tempStockTwo;
      
      // fetch the data for the 1st stock
      fetchStock(current_query.stock[0]).then((stockOneData) => {  
        return stockOneData 
      })
        // fetch is asynchronous so you must pass the stockOne value to the next '.then' function in the fetch chain
        .then((stockOneData) => {
          // fetch the data for the 2nd stock
          fetchStock(current_query.stock[1]).then((stockTwoData) => {

            // objects to hold stock info to be referenced later
            const stockOne = {
              symbol: stockOneData['Global Quote']['01. symbol'],
              price: stockOneData['Global Quote']['05. price']
            };
            const stockTwo = {
              symbol: stockTwoData['Global Quote']['01. symbol'],
              price: stockTwoData['Global Quote']['05. price']
            }; 
          
            // check each stock symbol from the user to see if it's valid
            if (stockOne.symbol == undefined) {
              res.send('stock one does not appear to be a valid stock symbol');
              throw new Error('stock one does not appear to be a valid stock symbol');
            }
            if (stockTwo.symbol == undefined) {
              res.send('stock two does not appear to be a valid stock symbol');
              throw new Error('stock two does not appear to be a valid stock symbol');
            }
          
            Stock.findOne({ symbol: stockOne.symbol }, function (err, docs) {
            // use for prod
            let current_ip = current_query.ip
            // flip var below with one above for internal testing
            //let current_ip = '1.2.3.4.5.6.7.8.9.10';
            
            // if the document doesn't exist in the db then create it and save it
            if (docs == null) {
              // if stock is not in db then save it
              var newStock = new Stock({ symbol: stockOne.symbol, likes: current_query.like })
              // if the user has liked the stock then save their ip so they can't like it again
              if (current_query.like == 1) {
                newStock.ips.push(current_ip)
              }
              newStock.save()
              tempStockOne = {stock: stockOne.symbol, price: stockOne.price, likes: current_query.like }
            }
            // else, it already exists so retrieve it and update if needed
            else {
              // if user has voted for this stock previously via the current ip return it without change
              if (docs.ips.includes(current_ip)) {
                tempStockOne = {stock: stockOne.symbol, price: stockOne.price, likes: docs.likes }
              }
              // else, check if the user wants to vote for it and update the document
              else {
                // if user has not voted for this stock yet increment and add their ip so they can't like it again
                if (current_query.like == 1) {
                  docs.ips.push(current_ip)
                }
                docs.likes = docs.likes + current_query.like
                docs.save()
                tempStockOne = {stock: stockOne.symbol, price: stockOne.price, likes: docs.likes }
              }
            }
          })
            .then(() => {
              Stock.findOne({ symbol: stockTwo.symbol }, function (err, docs) {
                // use for prod
                let current_ip = current_query.ip
                // flip var below with one above for internal testing
                //let current_ip = '1.2.3.4.5.6.7.8.9.10';
              
                // if the document doesn't exist in the db then create it and save it
                if (docs == null) {
                  var newStock = new Stock({ symbol: stockTwo.symbol, likes: current_query.like })
                  // if the user has liked the stock then save their ip so they can't like it again
                  if (current_query.like == 1) {
                    newStock.ips.push(current_ip)
                  }
                  newStock.save()
                  tempStockTwo = {stock: stockTwo.symbol, price: stockTwo.price, likes: current_query.like }
                }
                else {
                  // if user has voted for this stock previously via the current ip return it without change
                  if (docs.ips.includes(current_ip)) {
                    //user has liked already so just return the doc
                    tempStockTwo = {stock: stockTwo.symbol, price: stockTwo.price, likes: docs.likes }
                  }
                  // else, check if the user wants to vote for it and update the document
                  else {
                    // if user has not voted for this stock yet increment and add their ip so they can't like it again
                    if (current_query.like == 1) {
                      docs.ips.push(current_ip)
                    }
                    docs.likes = docs.likes + current_query.like
                    docs.save()
                    tempStockTwo = {stock: stockTwo.symbol, price: stockTwo.price, likes: docs.likes }
                  }  
                }
            })
              .then(() => {
                // save the likes from the temp stock objects so we can then replace it with rel-likes for the user
                let oneDataLikes = tempStockOne.likes
                delete tempStockOne.likes
                let twoDataLikes = tempStockTwo.likes
                delete tempStockTwo.likes
                tempStockOne.rel_likes = oneDataLikes - twoDataLikes;
                tempStockTwo.rel_likes = twoDataLikes - oneDataLikes;
                
                // update the return object and send it back to the user based on the updated stock info
                returnObj.stockData.push(tempStockOne)
                returnObj.stockData.push(tempStockTwo)
                res.json(returnObj)
            })
              .catch((error) => { 
                console.log(error);
                console.log("API call frequency is 5 calls per minute and 500 calls per day. This causes inconsistent failures for tests resulting in the error (TypeError: Cannot read property '01. symbol' of undefined).");
                res.send('API call frequency is 5 calls per minute and 500 calls per day. It appears you reached the limit, please wait a bit and try again.');
            });
          });
        });
      });
    };   
  });
};
