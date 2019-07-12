  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  var stockSchema = new Schema({
    symbol:  String,
    likes: Number,
    ips: [{type: String}]
  });

  var Stock = mongoose.model('Stock', stockSchema);
  module.exports = Stock;
  