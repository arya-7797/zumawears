const CartModel = require('../models/Cart')
const UsersModel = require('../models/user')
const moment = require("moment");

const paypal = require('paypal-rest-sdk');
const Razorpay = require('razorpay')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AZTiTJ3SinoNch-oKsYnThyIgswgN1W_6-6jMQTS8DgzDimvgL_o66hvHumPc8pnux7tSnbHsd8xaz4M',
    'client_secret': 'EOvmDvlvoT2Ie6rapZrsuYG-AymHXoRyh6fT4To2D6VNeWGgiYUXcL2lO-YN2_WCOOoby0CKs9yTz5dM'
});
var instance = new Razorpay({
    key_id: 'rzp_test_vxp4zfxoHxsBf4',
    key_secret: 'CDbBv7Qs5CHaeBFstrJwZQMI',
});



const userHelper = {


    getUserDetails : async(email)=>{
        const userDetails = await UsersModel.findOne({email: email});

        return userDetails;
     },



    getTotalCartAmount : async(userId)=>{
        

        let cartItems = await CartModel.aggregate([
            {   $match: { userId: userId }  },
            {   $match: { active: true }  },
            {   $unwind: '$products'        },
            {   $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {   $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {   $sort:{ _id : 1 }       }
        ])

        let grandTotal = 0;
        cartItems.forEach(function(item){
            let tquantity = item.quantity;
            let tprice =item.products[0].price;
            grandTotal = (tquantity*tprice)+grandTotal;
        })
        console.log('userId ',userId);
        console.log('grandd = ',grandTotal);
        return grandTotal;
    },


    getAllCartItem : async(userId)=>{
        let cartItems = await CartModel.aggregate([
            {   $match: { userId: userId }  },
            {   $match: { active: true }  },
            {   $unwind: '$products'        },
            {   $project: {
                    item: '$products.item',
                    quantity: '$products.quantity'
                }
            },
            {   $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'products'
                }
            },
            {   $sort:{ _id : 1 }       }
        ])
        console.log('uId= ',userId);
        console.log('cartItems = ',cartItems);
        return cartItems;
    },


    //paypal
    generatePaypal: (grandTotal)=>{
        console.log('91 = ',grandTotal);
        return new Promise((resolve, reject) => {
            console.log('93');
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/order-success",
                    "cancel_url": "http://localhost:3000/checkout"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": parseInt(grandTotal),
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": parseInt(grandTotal)
                    },
                    "description": "This is the payment description."
                }]
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                console.log(payment, 'payment typeeee');
                // console.log(payment.links[1].href);

                if (error) {
                    throw error;
                } else {
                    console.log("Create Payment Response");
                    resolve(payment.links[1].href)
                }
            });
        })
    },

///razorpay
    generateRazorpay : (orderId, total) => {
        console.log('generateRazorpay');
        return new Promise((resolve, reject) => {
            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            }, (err, order) => {
                resolve(order)
            }) 
        })
    },



     //wallet
     getWalletAmount : async(userId)=>{
        console.log('86');
        console.log('userId 87 = ',userId);

        let result = await UsersModel.findOne({_id: Object(userId)})
        console.log('90 = ',result);
        if(result.wallet){
            console.log('91 = ',result.wallet);
            return result.wallet
        }else{
            return 0
        }
    },
    
    verifyRazorpay : (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'CDbBv7Qs5CHaeBFstrJwZQMI')
    
            hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
            hmac = hmac.digest('hex')
            console.log('ddddd = ',details);
            
            console.log('hmac = ',hmac);
            console.log('details = ',details.payment.razorpay_signature);
            // if (hmac == details['payment[razorpay_signature]'])
            if (hmac == details.payment.razorpay_signature)
            {
                console.log('resolve');
                resolve()
            } else {
                console.log('reject');
                reject()
            }
    
        })
    }
}
module.exports = userHelper;