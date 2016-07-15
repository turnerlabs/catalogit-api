"use strict";

module.exports = function(error, req, res, next) {
    console.log(req)
    next();  
};
