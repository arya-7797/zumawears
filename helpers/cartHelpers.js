const CartModel = require('../models/Cart')
const Cart = require('../models/Cart')
const ObjectId = require('mongoose').Types.ObjectId
const cartHelpers = {
    getCartProduct : (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await CartModel.aggregate([
                {
                    $match: { userId: userId }
                },
                {
                    $unwind: '$products'
                },
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
                }
                
            ])

            resolve(cartItems)
        })
         
    }
}
module.exports = cartHelpers;