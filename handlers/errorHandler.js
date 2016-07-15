"use strict";

module.exports = function(error, req, res, next) {
    if (error) {
        res.json({'message': error.message});
        return;
    }
    next();  
};
