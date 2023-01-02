
const express = require('express')
const UsersModel = require('../models/user')
const ProductsModel = require('../models/product')
const BannerModel=require('../models/banner')
const bcrypt = require('bcrypt');
const { ConnectionPolicyPage } = require('twilio/lib/rest/voice/v1/connectionPolicy');
const CartModel = require('../models/Cart');
// const client = require('twilio')('AC99ce2828d0eeb22f08595009a9e55988', '5db26ec7bee9a045ef1ecddbf3a8ff21');
let dotenv = require('dotenv').config()
const client = require('twilio')(dotenv.parsed.accountSid, dotenv.parsed.authToken);

const app = express()
const ObjectId = require('mongoose').Types.ObjectId
const cartHelper = require('../helpers/cartHelpers')
const userHelper = require('../helpers/userHelpers')
const AddressModel = require('../models/address')
const OrdersModel = require('../models/orders')
const CategoryModel = require('../models/category')
const CouponModel = require('../models/couponModel')
const moment = require('moment')


var minm = 10000;
var maxm = 99999;
let otp = Math.floor(Math.random() * (maxm - minm + 1)) + minm;






const usercontroller = {

    homeview: async(req, res) => {
        const products = await ProductsModel.find({}).sort({ _id: -1 })
        const banners= await BannerModel.find({})
        console.log("banners",banners);
        res.render('users/index',{products,banners})
    },

    loginGet: (req, res) => {
        res.render('users/login')
    },
    loginPost: async (req, res) => {
        let email = req.body.email;
        let password = req.body.password;
        let count = await UsersModel.findOne({ email: email }).count()

        if (count > 0) {
            let userDetails = await UsersModel.findOne({ email: email })
            console.log('pass = ', userDetails.password);
            console.log('pass = ', password);
            if (await bcrypt.compare(password, userDetails.password)) {

                //Set the sessions
                req.session.user = userDetails;
                req.session.loggedIn = true;
                req.session.admin = false;

                res.redirect('/')
            } else {
                res.render('users/login', { loginError: true, msg: 'Invalid Credentials!' })
            }
        } else {
            res.render('users/login', { loginError: true, msg: 'Invalid Credentials!' })
        }

    },
    otpLoginGet: (req, res) => {
        res.render('users/otp-login')
    },
    otpLoginPost: async (req, res) => {

        const userDetails = await UsersModel.findOne({ phone: req.body.phone });
        req.session.user = userDetails

        const toPhno = '+91' + req.body.phone;

        console.log('otp = ' + otp);
        console.log('reg = ', userDetails);
        console.log('gave = ', toPhno);

        if (userDetails != null) {
            client.messages.create({
                body: 'your otp is ' + otp,
                from: '12058136491',
                to: toPhno
            })
                .then(message => console.log(message.sid));

                res.render('users/otp-login',{userDetails})
        }
        else {
            res.render('users/login', { otpError: true, msg: 'Phone Number does not exist' })
        }


    },
    otpVerifyPost: async (req, res) => {
        console.log("haiiiiiii",req.body)

        if (otp == req.body.otp) {
            req.session.userEmail = req.session.user.email;
            req.session.loggedIn = true;
            req.session.admin = false;

            res.redirect('/')
        } else {
            
            res.render('users/otp-login', { error: true, msg: 'Invalid Otp' })
        }

    },
    signup: (req, res) => {
        res.render('users/signup')
    },

    signupPost: async (req, res) => {
        try {
            const password = req.body.password;
            const confirmPassword = req.body.cpassword;

            // to check user already exists
            const count = await UsersModel.find({ email: req.body.email }).count()
            console.log('count', count);

            if (count != 0) {
                res.render('users/signup', { signupError: true, msg: 'User already exists!' })
            }
            else {

                if (password == confirmPassword) {

                    const passwordHashed = await bcrypt.hash(password, 10)

                    const user = new UsersModel({
                        name: req.body.name,
                        email: req.body.email,
                        phone: req.body.phone,
                        password: passwordHashed,
                        active: true
                    })
                    const result = await user.save();

                    const userDetails = await UsersModel.findOne({ email: req.body.email })

                    //Set the sessions
                    req.session.user = userDetails;
                    req.session.loggedIn = true;
                    req.session.admin = false;

                    res.redirect('/')
                }
                else {
                    res.render('users/signup', { signupError: true, msg: "Password doesn't match! " })
                }


            }



        } catch (error) {
            res.send('erororor = ', error)
        }

    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) console.log("Error loging out : ", err)
            else res.redirect('/login')
        })
    },

    productsView: async (req, res) => {
        try {
            const products = await ProductsModel.find({}).sort({ _id: -1 })
            res.render('users/products', { products })
        } catch (error) {
            res.redirect('/')
        }
    },
    //Product
    productsView: async (req, res) => {
        try {
            const products = await ProductsModel.find({}).sort({ _id: -1 })
            const categories = await CategoryModel.find({}).sort({ _id: -1 })
            console.log('cat = ',products);
            res.render('users/products', { products ,categories})
        } catch (error) {
            res.redirect('/')
        }
    },
    productDetails: async (req, res) => {
        try {
            let prdtId = req.query.id;
            // const userDetails = await Register.findOne({email: req.session.userEmail});

            // cart
            var cartExistCheck;
            let addedToCart = false;
            console.log(req.session.user.email);
            console.log("hiiiiiii Arya")
            if (req.session.loggedIn) {
                const userDetails = await UsersModel.findOne({ email: req.session.user.email });

                console.log("hiiiiiii")
                cartExistCheck = await CartModel.findOne({ userId: userDetails._id.valueOf(), active: true, 'products.item': ObjectId(prdtId) })
                console.log('cart Exist = ', cartExistCheck);
                if (cartExistCheck != null) {
                    addedToCart = true;
                }
            }

            // cart
            const product = await ProductsModel.findOne({ _id: prdtId })
            // console.log(product);
            let zoom = true;
            req.locals = zoom;
            res.render('users/product-details', { product, zoom, addedToCart })
        } catch (error) {
            res.redirect('products')
        }
    },

    addToCartPost: async (req, res) => {
        console.log('213');
        try {
            console.log('sessionEmail = ', req.session.user.email);
            const userDetails = await UsersModel.findOne({ email: req.session.user.email });
            console.log("hiiiiiii")
            let pid = ObjectId(req.body.pid)
            console.log('pid = ', pid);

            let prdts = {
                item: pid,
                quantity: parseInt(req.body.num_product)
            }

            const check = await CartModel.findOne({ userId: userDetails._id.valueOf(), active: true })
            console.log("hii")
            if (check) {
                console.log('hi');
                console.log('userDetails._id', userDetails._id.valueOf());
                const resu = await CartModel.updateOne({ userId: userDetails._id.valueOf(), active: true }, { $push: { products: prdts } });
                console.log('update ', resu);
            }
            else {
                const cart = new CartModel({
                    userId: userDetails._id,
                    products: prdts,
                    active: true
                })

                console.log('cart page');
                const result = await cart.save();
                console.log('add result = ', result);
            }

            // res.redirect(`/product-details?id=${pid}`)
            res.status(200).send({response: true})
        } catch (error) {
            res.redirect('login')
        }

    },
    viewCart: async (req, res) => {
        req.session.previousUrl = '/cart'
        res.locals.pageTitle = 'cart'

        try {
            const userDetails = await UsersModel.findOne({ email: req.session.user.email });
            console.log("hii ooiskn");
            let userId = userDetails._id.valueOf()
            console.log("userId", userId);
            // let userId = '6360a2eea72cffca128104bf'



            let cartItems = await CartModel.aggregate([
                { $match: { userId: userId } },
                { $match: { active: true } },
                { $unwind: '$products' },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                { $sort: { _id: 1 } }

            ])



            console.log('cartItem', cartItems);



            if (cartItems.length < 1) {
                res.render('users/cart', { cartEmpty: true })
            }
            else {
                console.log("heyyyy", cartItems[0].products)
                res.render('users/cart', { cartItems, userId })
            }

        } catch (error) {
            res.redirect('/login')
        }


    },

    removeFromCart: async (req, res) => {
        console.log('305');
        try {
            let productId = req.body.product;
            let userId = req.body.userId;
            const cart = await CartModel.updateOne({ userId: userId, active: true }, { $pull: { 'products': { item: ObjectId(productId) } } })
            console.log('deleted = ', cart);
            res.status(200).send({ success: true, message: 'Success' })

        } catch (error) {
            res.status(400).send({ success: false, message: error.message })
        }
    },
    changePrdtQty: async (req, res) => {
        console.log("hiirrrrrreeee")
        try {
            let productId = req.body.product;
            let userId = req.body.userId;
            let count = req.body.count;
            let quantity = req.body.quantity;
            console.log('quantity = ', quantity);
            console.log("hiirrrrrreeeed", productId, userId, count, quantity)
            let removeProduct = false;
            if (count == -1 && quantity == 1) {
                console.log('deleted = ');
                const cart = await CartModel.updateOne({ userId: userId, active: true }, { $pull: { 'products': { item: ObjectId(productId) } } })
                console.log(cart);
                res.json({ quantity: parseInt(quantity) - 1, removeProduct: true })
            }
            else {
                const cart = await CartModel.findOneAndUpdate({ userId: userId, active: true, 'products.item': ObjectId(productId) }, { $inc: { 'products.$.quantity': parseInt(count) } })


                if (count == 1) res.json({ quantity: parseInt(quantity) + 1, removeProduct: false });
                else if (count == -1) res.json({ quantity: parseInt(quantity) - 1, removeProduct: false })
            }

        } catch (error) {
            res.status(400).send({ success: false, message: error.message })
        }
    },


    //Checkout
    checkoutGet: async (req, res) => {
        req.session.previousUrl = '/checkout'
        try {
            const userDetails = await UsersModel.findOne({ email: req.session.user.email }); //temp
            console.log("Boooom");
            let userId = userDetails._id.valueOf()

            let cartItems = await CartModel.aggregate([
                { $match: { userId: userId } },
                { $match: { active: true } },
                { $unwind: '$products' },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                { $sort: { _id: 1 } }
            ])
            console.log('uid = ', userId);
            let addresses = await AddressModel.find({ userId: Object(userId) })
            let grandTotal = await userHelper.getTotalCartAmount(userId);
            console.log('grand total = ', grandTotal);
            console.log('addresses = ', addresses);
            if (cartItems.length < 1) {
                res.render('users/cart', { cartEmpty: true })
            }
            else {
                res.render('users/checkout', { cartItems, userId, grandTotal, addresses,userDetails })
            }

        } catch (error) {
            res.redirect('/login')
        }

    },


    checkoutPost: async (req, res) => {
        console.log('body = ' + req.body);
        try {
            const userDetails = await UsersModel.findOne({ email: req.session.user.email }); //temp
            let userId = userDetails._id.valueOf()

            let cartItems = await CartModel.aggregate([
                { $match: { userId: userId } },
                { $match: { active: true } },
                { $unwind: '$products' },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                { $sort: { _id: 1 } }
            ])
            console.log('uid = ', userId);
            let addresses = await AddressModel.find({ userId: Object(userId) })

            let grandTotal = req.body.grandTotal;
            // let coupon = req.body.coupon;
            let discount = req.body.discount;
            console.log('grand total = ', grandTotal);
            console.log('addresses = ', addresses);
            if (cartItems.length < 1) {
                res.render('users/cart', { cartEmpty: true })
            }
            else {
                res.render('users/checkout', { cartItems, userId, grandTotal, addresses, coupon, discount })
            }
        } catch (error) {
            res.status(400).send({ success: false, message: error.message })
        }
    },


    cartCheckOutPost: async (req, res) => {
        console.log('body = ', req.body.grandTotal);
        req.session.grandTotal = req.body.grandTotal;
        res.redirect('/checkout')
    },
    selectAddressCheckOut: async (req, res) => {
        console.log('booody = ', req.body);
        let address = await AddressModel.findOne({ _id: Object(req.body.addressId) })
        console.log(address);
        res.status(200).send({ success: true, address })

    },
    
    confirmCheckoutPost: async (req, res) => {

        // try {
            console.log('38333333 = ', req.body);
            const userDetails = await UsersModel.findOne({ email: req.session.user.email });
            console.log(userDetails);
            let userId = userDetails._id.valueOf()
            // let userId = '6360a2eea72cffca128104bf'
            let objUserId = ObjectId(userId)
            console.log(objUserId);

            console.log('389');
            //setting address
            const address = {
                userId: objUserId,
                name: req.body.name,
                phone: req.body.phone,
                fullAddress: req.body.address,
                country: req.body.country,
                state: req.body.state,
                district: req.body.district,
                landmark: req.body.landmark,
                city: req.body.city,
                pincode: req.body.pincode,
            }

            let timee = Date.now()
            // let grandTotal = await userHelper.getTotalCartAmount(userId)
            let grandTotal = req.body.grandTotal
            let discount = req.body.discount;
            console.log('406 = ', grandTotal);
            console.log('406 = ', discount);
            let cartItems = await userHelper.getAllCartItem(userId);
            console.log('407 = ', cartItems);

            console.log('new obj ', cartItems);

            //To save address only if newly addedd
            if (req.body.addressRadio != 'on') {
                console.log('Hee');
                const addressNew = new AddressModel(address);
                const res = await addressNew.save();
                console.log('address save = ', res);
            }

            //To place order for each cart items


            cartItems.forEach(async element => {
                const order = new OrdersModel({
                    userId: objUserId,
                    cartId: element._id,
                    address: address,
                    amount: parseInt(grandTotal),
                    paymentMode: req.body.paymentMethod,
                    paymentStatus: 'success',
                    status: 'placed',
                    items: element.item,
                    product: element.products[0],
                    quantity: parseInt(element.quantity),
                    discountPercentage: discount,
                    coupon: req.body.coupon,
                    date: timee
                })

                console.log('424');
                const result = await order.save();
                console.log('result', result);

                
                //Update Stock
                let currentPrdt = await ProductsModel.findOne({ _id: element.item })
                let stockNew = parseInt(currentPrdt.stock) - parseInt(element.quantity)
                const updateProduct = await ProductsModel.updateOne({ _id: element.item }, { $set: { stock: stockNew } })

            })


            //Make Cart Inactive
            cartId = cartItems[0]._id;
            console.log('cartItems Id = ', cartId);
            let updateCart = await CartModel.updateOne({ _id: cartId }, { 'active': false }, { upsert: true })
            console.log('updateCart ==== ', updateCart);


            // let codPlaced = await OrdersModel.update({cartId:cartId},{$set : {'status': 'placed',paymentMode:'cod'}} ,{upsert: true})
            // console.log('codPlaced = ',codPlaced);

            if(req.body.paymentMethod == 'cod'){
                res.status(200).send({success:true,codSuccess:true})
            }
            else if(req.body.paymentMethod=='paypal'){
                 userHelper.generatePaypal(grandTotal).then(async (link)=>{
                    // let codPlaced = await OrdersModel.updateMany({cartId:cartId},{$set :{'status': 'placed',paymentMode:'paypal',paymentStatus:'payed'}} ,{upsert: true})
                    res.status(200).send({success:true,paypalSuccess:true,link})
                })
            }else if(req.body.paymentMethod=='razorpay'){
                userHelper.generateRazorpay(cartItems[0]._id,grandTotal).then(async (response)=>{
                    console.log('463 +',response);
                    res.status(200).send(response)
                })
            }else if(req.body.paymentMethod=='wallet'){
                console.log('wallet');
                // let walletPlaced = await OrdersModel.updateOne({cartId:cartId},{$set : {'status': 'placed',paymentMode:'wallet'}} ,{upsert: true})
                let walletBalance = await userHelper.getWalletAmount(req.session.user._id)
                let remaining = parseInt(walletBalance) - grandTotal
                console.log('574');
                let result2 = await UsersModel.updateOne({_id:req.session.user._id},{wallet:remaining},{upsert:true})
                // console.log('wallet = ',walletPlaced);
                res.status(200).send({success:true,codSuccess:true})
            }



        // } catch (error) {
        //     res.redirect('login')
        // }
    },
  //RazorPay
  verifyRazorpayPayment: (req,res)=>{

    userHelper.verifyRazorpay(req.body).then(async ()=>{
        let status = 'placed'
        ////////////
        // code to change the order status
        ///////////
        let razorPlaced = await OrdersModel.updateMany({cartId:cartId},{$set: {'status': 'placed',paymentMode:'razorpay',paymentStatus:'payed'}} ,{upsert: true})

        res.status(200).send({status:true})       
    }).catch((err)=>{
        console.log('erro = ',err);
        res.status(400).send({status:false})
    })
},


    orderSuccessView: async (req, res) => {
        res.render('users/order-success')
    },
    ordersView: async (req, res) => {
        try {
            res.locals.moment = moment;
            const userDetails = await UsersModel.findOne({email: req.session.user.email});
            let userId = userDetails._id.valueOf()
            // let userId = '6360a2eea72cffca128104bf'
            let objUserId = ObjectId(userId)

            let orders = await OrdersModel.find({userId: Object(userId)}).sort({date:-1})
            // console.log('osdf  ',orders);

            let cartIds = await OrdersModel.aggregate([ { $match: { userId : ObjectId(userId) } } , 
                                                        { $group: {_id: null, orderId: {$addToSet: "$cartId"}}}, 
                                                        { $unwind: "$orderId" }, { $project: { _id: 0 }}, {$sort: {'date':-1}} ])
                console.log('631 = ',cartIds);
            let carr=[]; 
            cartIds.forEach(cart => {
                console.log('cart = ',cart.orderId);
                carr.push(cart.orderId.valueOf())
            });

            console.log('cdd = ',carr);
            // carr.reverse()


          console.log("orders",orders);

            res.render('users/orders',{orders,cartIds : carr})
        } catch (error) {
            res.redirect('login')
        }
    },
    cancelOrder: async (req, res) => {
        try {
            let orderId = req.body.orderId;
            let returnPrice = parseInt(req.body.returnPrice)
            console.log(orderId);
            const result = await OrdersModel.updateOne({ _id: Object(orderId) }, { $set: { 'status': 'cancelled' } })
            const order = await OrdersModel.findOne({ _id: Object(orderId) });
            let userDetails = await UsersModel.findOne({_id:req.session.user._id})
            
            console.log('userDet = ',userDetails);
            console.log('Result = ',result);
            if(order.paymentMode!='cod' ){
            if(userDetails.wallet!=undefined){
                let wallet= userDetails.wallet
                wallet = parseInt(wallet)+parseInt(returnPrice)
                let result2 = await UsersModel.updateOne({_id:req.session.user._id},{wallet:wallet},{upsert:true})
            }
            else{
                let result2 = await UsersModel.updateOne({_id:req.session.user._id},{wallet:returnPrice},{upsert:true})
            }
        }
            res.status(200).send({ success: true, message: 'Success' })
        } catch (error) {
            res.status(400).send({ success: false, message: error.message })
        }
    },
    //Return
    returnOrder: async(req,res)=>{
        try {
            console.log('764 = ',req.body);
            let orderId = req.body.orderId
            let returnPrice = parseInt(req.body.returnPrice)
            let result = await OrdersModel.updateOne({_id:Object(orderId)},{status:'returned'})
            let userDetails = await UsersModel.findOne({_id:req.session.user._id})
            
            console.log('userDet = ',userDetails);
            console.log('userDet = ',userDetails.wallet);
            if(userDetails.wallet!=undefined){
                let wallet= userDetails.wallet
                wallet = parseInt(wallet)+parseInt(returnPrice)
                let result2 = await UsersModel.updateOne({_id:req.session.user._id},{wallet:wallet},{upsert:true})
            }
            else{
                let result2 = await UsersModel.updateOne({_id:req.session.user._id},{wallet:returnPrice},{upsert:true})
            }
            res.status(200).send({success:true,msg: 'Success'})
        } catch (error) {
            res.status(400).send({success:true,msg: 'Something went wrong'})
        }
    },
    viewOrderedProduct: async (req, res) => {
        console.log('565');
        try {
            let orderId = req.query.id
            let orderedItems = await OrdersModel.findOne({ _id: Object(orderId) })
            console.log('ord ', orderedItems.items);
            res.render('users/ordered-product', { orderedItems: orderedItems.items })
        } catch (error) {
            res.redirect('/login')
        }
    },

addreview: (req,res)=>{
    res.render('users/add-reviews');
},

    // addreview: (req, res) => {
    //     const { title, text, author, rating, product } = req.body;
    //     const review = new Review({
    //       title,
    //       text,
    //       author,
    //       rating,
    //       product
    //     });
    //     review.save((err, review) => {
    //       if (err) {
    //         res.status(500).send(err);
    //       } else {
    //         res.send(review);
    //       }
    //     });
    //   },

      
      
    applyCoupon: async (req, res) => {
        try {
            let couponDetails = await CouponModel.findOne({ coupon: req.body.coupon })
            let checkAlreadyUsed = await CouponModel.findOne({ coupon: req.body.coupon, usedBy: { $in: [req.session.user._id] } }).count()

            if (checkAlreadyUsed == 0) {
                if (couponDetails != null) {
                    let result = await CouponModel.updateOne({ coupon: req.body.coupon }, { $push: { usedBy: req.session.user._id } })
                    res.status(200).send({ success: true, discount: couponDetails.percentage })
                } else {
                    res.status(200).send({ success: false, msg: 'Invalid coupon.' })
                }
            } else {
                res.status(200).send({ success: false, msg: 'Invalid coupon.' })
            }

        } catch (error) {
            res.status(400).send({ success: false, msg: 'Something went Wrong!' })
        }
    },





    // Profile
    myProfileGet: async (req, res) => {
        try {
            console.log('heheheheeheheh');
            let userDetails = await userHelper.getUserDetails(req.session.user.email);
            console.log('452 = ', userDetails);
            if (userDetails == null) throw 'user not logined'

            const addresses = await AddressModel.find({ userId: userDetails._id }).sort({ date: -1 })
            res.render('users/my-profile', { userDetails, addresses })
        } catch (error) {
            res.redirect('login')
        }
    },
    addAddressProfilePost: async (req, res) => {
        try {
            const userDetails = await userHelper.getUserDetails(req.session.user.email)
            if (userDetails == null) throw 'user not loggined'

            const address = await new AddressModel({
                userId: userDetails._id,
                name: req.body.name,
                phone: req.body.phone,
                country: req.body.country,
                fullAddress: req.body.address,
                pincode: req.body.pincode,
                city: req.body.city,
                state: req.body.state,
                district: req.body.district,
                landmark: req.body.landmark,
                date: Date.now()
            })

            const result = await address.save();

            res.status(200).send({ success: true, message: 'Edit Success' })
        } catch (error) {
            res.status(400).send({ success: false, message: 'Something went wrong' })
        }
    },
    editUserPost: async (req, res) => {
        try {
            let userDetails = await userHelper.getUserDetails(req.session.user.email)
            if (userDetails == null) throw 'user not loggined'

            let emailCount = await UsersModel.find({ $and: [{ email: req.body.email }, { email: { $ne: req.session.user.email } }] }).count()
            if (emailCount) {
                var emailExist = true;
                throw 'Email already Exists!'
            }

            const result = await UsersModel.updateOne({ _id: userDetails._id }, {
                name: req.body.name,
                lastname: req.body.lname,
                email: req.body.email,
                phone: req.body.phone,
                gender: req.body.gender
            }, { upsert: true });
            console.log('resss = ', result);

            res.status(200).send({ success: true, message: 'Edit Success' })
        } catch (error) {
            console.log('error = ', error);
            res.status(200).send({ success: false, message: error, emailExist })
        }
    },

    changePassword: async (req, res) => {
        console.log('req = ', req.body);
        let userDetails = await UsersModel.findOne({ email: req.session.user.email })
        console.log(' dd' , userDetails);
        if (await bcrypt.compare(req.body.currentPass, userDetails.password)) 
            {
                console.log('655');
                const passwordHashed = await bcrypt.hash(req.body.newPass, 10)

                await UsersModel.updateOne({ email: req.session.user.email }, { password: passwordHashed })

                res.status(200).send({ response: true })
            }
            else{
                res.status(200).send({ response: false })
            }
    }
}




    







module.exports = usercontroller;