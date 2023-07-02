import express from 'express';
import { UpdateVendedor } from '../controllers/UserController.mjs'
import { createShop, updateShop } from '../controllers/ShopController.mjs'
import {verifyTokenUser, verifyTokenAdmin } from '../middlewares/token.mjs'
const router = express.Router();

router.post('/create-tienda', verifyTokenUser, UpdateVendedor, createShop);
router.put('/create-tienda', verifyTokenUser, updateShop);


export default router;