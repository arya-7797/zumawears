const express = require('express')
const router = express.Router()
const usercontroller=require('../controller/usercontroller')
const  UsersModel = require('../models/user')
// const Review = require('../models/Review');




// router.get('/login',forLogin,userControl.loginView)
// router.post('/login',forLogin,userControl.loginPost)
const adminCheck = ((req,res,next)=>{
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if(req.session.admin)
        res.redirect('/admin')
    else
        next();
})

const forLogin =  ((req,res,next)=>{
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if(req.session.loggedIn)
        res.redirect('/')
    else
        next();
}) 

const reEstablish = ((req,res,next)=>{
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    next()
})


const restrict = (async (req,res,next)=>{
    req.session.previousUrl = '/'
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if(req.session.loggedIn){
        let userDet =     await  UsersModel.findOne({email:req.session.user.email})

        if(userDet.active == false) res.redirect('/logout')
        else    next();
    }
    else    res.redirect('/login')
})



//login
router.get('/',adminCheck,usercontroller.homeview)
router.get('/login',forLogin,usercontroller.loginGet)
router.post('/login',forLogin,usercontroller.loginPost)
router.get('/signup',forLogin,usercontroller.signup)
router.post('/signup',forLogin,usercontroller.signupPost)
router.get('/logout',usercontroller.logout)



//otpLogin

router.get('/otp-login',forLogin,usercontroller.otpLoginGet)
router.post('/otp-login',forLogin,usercontroller.otpLoginPost)
router.post('/otp-verify',forLogin,usercontroller.otpVerifyPost)

router.post('/abc',(req,res)=>{
    console.log('heh');
    console.log('ody = ',req.body);

    res.send('hello')
})



//products

router.get('/products',reEstablish,usercontroller.productsView)
router.get('/product-Details',reEstablish,usercontroller.productDetails)
router.patch('/change-product-quantity',restrict,usercontroller.changePrdtQty)


//cart
router.get('/addToCart',(req,res)=>{
    console.log('hello add to cart');
})


router.patch('/addToCart',restrict,usercontroller.addToCartPost)
router.get('/cart',restrict,reEstablish,usercontroller.viewCart)
router.delete('/remove-from-cart',restrict,usercontroller.removeFromCart)



//checkout

router.get('/checkout',restrict,reEstablish,usercontroller.checkoutGet)
router.post('/checkout',restrict,usercontroller.checkoutPost)
router.post('/cartCheckOutPost',restrict,usercontroller.cartCheckOutPost)
router.post('/select-address',restrict,usercontroller.selectAddressCheckOut)
router.post('/confirm-checkout',restrict,usercontroller.confirmCheckoutPost)
router.get('/order-success',restrict,reEstablish,usercontroller.orderSuccessView)
router.get('/orders',restrict,usercontroller.ordersView)
router.post('/cancel-order',restrict,usercontroller.cancelOrder)
router.get('/view-order-products',restrict,reEstablish,usercontroller.viewOrderedProduct)

// payment
router.post('/verify-payment',restrict,usercontroller.verifyRazorpayPayment)

// router.post('/confirm-checkout',usercontroller.confirmCheckout)


 router.get('/add-reviews',usercontroller.addreview)
// router.post('/add-reviews',usercontroller.addreview)




// profile
router.get('/my-profile',restrict,usercontroller.myProfileGet)
router.post('/add-address-profile',restrict,usercontroller.addAddressProfilePost)
router.patch('/edit-user-details',restrict,usercontroller.editUserPost)
router.patch('/change-password',restrict,usercontroller.changePassword)



// return
router.patch('/return-order',restrict,usercontroller.returnOrder)

//coupon
router.post('/apply-coupon',restrict,usercontroller.applyCoupon)



module.exports=router
