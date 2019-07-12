/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
    
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', '96.89.118.93,::ffff:10.10.11.112,::ffff:10.10.10.218')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG')
          assert.isOk(res.body.stockData.price)
          done();
        });
      }); 
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', '96.89.118.94,::ffff:10.10.11.112,::ffff:10.10.10.218')
          .query({stock: 'msft', like: 'true'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData.stock, 'MSFT')
            assert.isOk(res.body.stockData.price)
            assert.equal(res.body.stockData.likes, 1) 
            done();
        });
      }); 
 
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          //use same ip from test above so like doesn't increment
          .set('x-forwarded-for', '96.89.118.94,::ffff:10.10.11.112,::ffff:10.10.10.218')
          .query({stock: 'msft', like: 'true'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData.stock, 'MSFT')
            assert.isOk(res.body.stockData.price)
            assert.equal(res.body.stockData.likes, 1);
            done();
        }); 
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', '96.89.118.94,::ffff:10.10.11.112,::ffff:10.10.10.218')
          .query({stock: ['msft', 'goog']})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData[0]['stock'], 'MSFT')
            assert.isOk(res.body.stockData[0]['price'])
            assert.isNotNull(res.body.stockData[0]['rel_likes'])
            assert.equal(res.body.stockData[1]['stock'], 'GOOG')
            assert.isOk(res.body.stockData[1]['price'])
            assert.isNotNull(res.body.stockData[1]['rel_likes'])
            assert.equal(res.body.stockData.length, 2)
            done();
        }); 
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server) 
          .get('/api/stock-prices')
          .set('x-forwarded-for', '97.89.118.94,::ffff:10.10.11.112,::ffff:10.10.10.218')
          .query({stock: ['amd', 'nke'], like: 'true'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData[0]['stock'], 'AMD')
            assert.isOk(res.body.stockData[0]['price'])
            assert.equal(res.body.stockData[0]['rel_likes'], 0)
            assert.equal(res.body.stockData[1]['stock'], 'NKE')
            assert.isOk(res.body.stockData[1]['price'])
            assert.equal(res.body.stockData[1]['rel_likes'], 0)
            assert.equal(res.body.stockData.length, 2)
            done();
        });         
      });
    });
});