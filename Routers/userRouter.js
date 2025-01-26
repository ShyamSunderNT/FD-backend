import express from 'express';
import { forgotPassword, loginUser, loginWithOtp, requestLoginOtp, signupUser, uploadMiddleware,} from '../Controllers/userControllers.js';
import { verifyToken } from '../Middleware/verifyToken.js';
import { deleteUser, getLocation, getUserDetails, updateAddress, updatePhoneNumber } from '../Controllers/getuserController.js';



const router = express.Router();

router.post("/signup", uploadMiddleware , signupUser)
router.post("/login", loginUser)
router.post("/requestLoginOtp",requestLoginOtp)
router.post("/loginWithOtp", loginWithOtp)
router.post("/forgetpassword",forgotPassword)
router.post("/getuserdetails",getUserDetails)
router.post("/updatephonenumber",updatePhoneNumber)
router.post("/updateaddress",updateAddress)
router.post("/locationupdate",getLocation)
router.post("/deleteuser",deleteUser)





export default router;