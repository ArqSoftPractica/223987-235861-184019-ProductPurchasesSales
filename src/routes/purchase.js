const express = require('express');
const Router    = express.Router()
const PurchaseController = require('../controllers/purchases-controller')
const purchaseController = new PurchaseController();
const verifyCompanyApiKey = require("../authorization/verify-company-api-key");
const verifyToken = require("../authorization/verify-token");
const verifyRole = require('../authorization/role-check');
const verifyRoleTest = require('../authorization/verify-role-test');

Router.use(express.json());
Router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-api-key');
    res.setHeader('Content-Type', 'application/json');
    next(); 
});
Router.post('/purchases', verifyToken, verifyRole(), (req, res, next) => purchaseController.createPurchase(req, res, next));
Router.get('/purchases', verifyToken, verifyRole(), (req, res, next) => purchaseController.getPurchases(req, res, next));
Router.get('/purchases/:id', verifyToken, verifyRole(), (req, res, next) => purchaseController.getPurchase(req, res, next));

Router.get('/purchases/provider/:id', verifyCompanyApiKey, (req, res, next) => purchaseController.getPurchasesPerProvider(req, res, next));
Router.get('/purchasesTest/provider/:id', verifyToken, verifyRoleTest, (req, res, next) => purchaseController.getPurchasesPerProvider(req, res, next));

module.exports = Router