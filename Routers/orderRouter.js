import express from 'express';
import { confirmPayment, myOrderData, OrderData, removeOrder } from '../Controllers/orderController.js';
import { feedback } from '../Controllers/feedbackController.js';


const router = express.Router();

router.post("/orders/create",OrderData)
router.post("/orders/details",myOrderData)
router.post("/removeorder",removeOrder)
router.post("/feedback",feedback)
router.post("/conformpayment",confirmPayment)


export default router;   