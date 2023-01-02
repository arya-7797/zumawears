const fs = require('fs')
const express=require ('express')
const ObjectId = require('mongoose').Types.ObjectId
const UsersModel = require('../models/user')
const bcrypt          = require('bcrypt');
const CategoryModel = require('../models/category');
const AdminsModel = require('../models/admin');
const ProductsModel = require('../models/product');
const BannerModel =require('../models/banner');
const moment = require("moment");
const OrdersModel    =   require('../models/orders')
const adminHelper = require('../helpers/adminHelper')
const CouponsModel = require('../models/couponModel')

const salesHelpers = require('../helpers/salesManagingHelper')
const OfferProductsModel = require('../models/offerProduct')
const app=express()



const admincontroller={

    dashboard: async (req,res)=>{
        // res.render('admin/index');
        try {
            let revenueDaily =  await   adminHelper.dailyRevenue()
            console.log('39');
            let revenueWeekly =  await   adminHelper.weeklyRevenue()
            let revenueYearly =  await   adminHelper.yearlyRevenue()
            let revenueTotal =  await   adminHelper.totalRevenue()
            console.log('revenueDaily', revenueDaily)
            console.log('revenueWeekly', revenueWeekly)
            console.log('revenueYearly', revenueYearly)
            console.log('revenueTotal', revenueTotal)

            let totalUsers = await adminHelper.getUsersCount();
            let ordersCount = await adminHelper.getOrdersCount();
            let deliveredCount = await adminHelper.getDeliveredOrderCount();
            let productsCount = await adminHelper.getProductsCount();
            res.render('admin/index',{revenueDaily,revenueWeekly,revenueYearly,revenueTotal,totalUsers,ordersCount,productsCount,deliveredCount})
        } catch (error) {
            res.redirect('view-products')
        }
    },


   

    // Categories
    categoriesView: async(req,res,next)=>{
        res.locals.moment = moment;
        const categories=await CategoryModel.find({}).sort({_id:-1})
        res.render('admin/categories',{categories})
        
    },
   

    addCategoryGet :(req,res)=>{
        res.render('admin/add-category')
    },

//     addCategoryPost : async(req,res,next)=>{
//         let count =await CategoryModel.find({categoryTitle : req.body.title}).count();
//         let img1
//         if(count==0){

//             if(req.file!=undefined)  img1 = req.file.filename
       
//         const category = new CategoryModel({
//             categoryTitle: req.body.title,
//             image: img1
//         }) 
    
//         const result = await category.save();


//         console.log('result=',result);
//         res.redirect('category')

//     }else{
//         res.render('admin/add-category',{error:true,msg:'Category already Exists'})
//     }
// },
addCategoryPost :   async(req,res,next)=>{
    let img1
    let count = await CategoryModel.find({categoryTitle:req.body.title}).count();

    if(count==0){
        if (req.file!=undefined)    img1 = req.file.filename

        console.log('body - ',req.body);
        let category;
        if(req.body.offerToggler){
            category = new CategoryModel({
                categoryTitle: req.body.title,
                offerStart: req.body.startDate,
                offerEnd: req.body.endDate,
                discount: parseInt(req.body.percentage),
                offerActive: true,
                categoryActive: true,
                image: img1
            }) 

        }else{
            category = new CategoryModel({
                categoryTitle: req.body.title,
                offerActive: false,
                categoryActive: true,
                image: img1
            }) 
        }

        const result = await category.save();
        console.log('result = ',result);

        res.redirect('category')
    }else{
        res.render('admin/add-category',{error:true,msg:'Category already exists!'})
    }


},
deleteCategory : async(req,res,next)=>{
    try {
        const categoryId = req.body.categoryId;
        let categoryTemp = await CategoryModel.findOne({_id: Object(categoryId) })
        
        const category = await CategoryModel.deleteOne({_id: Object(categoryId)})
        res.status(200).send({success:true,message: 'Success'})
    } catch (error) {
        res.status(400).send({success:false,message: 'Something went wrong'})
    }
},


    editCategoryGet: async(req,res,next)=>{
      const catId= req.query.id;
      const category=await CategoryModel.findOne({_id:Object(catId)})
      res.render('admin/edit-Category',{category})
    },
    // editCategoryPost: async(req,res,next)=>{
    //     console.log('title', req.body);
    //     const catId= req.body.catid;
    //     let currentCategory =  await CategoryModel.findOne({_id: catId})

    //     const result=await CategoryModel.updateOne({_id:Object(catId)},{'categoryTitle':req.body.title },{upsert:true});
    //     const getOldImage= await CategoryModel.findOne({_id:Object(catId)});
    //     console.log('getOldImg');
    //     console.log('getOldImg.Image');



    //     // update Product
    //     let productUpdate= await ProductsModel.updateMany({'category': currentCategory.categoryTitle},{category:req.body.title } )
        
    //     if (req.file)
    //     {
    //         if(fs.existsSync('./public/uploads/categories'+getOldImage.image)){
    //             fs.unlinkSync('./public/uploads/categories'+getOldImage.image)
    //         }
    //         const result=await CategoryModel.updateOne({_id:Object(catId)},{'image':req.file.filename},{upsert:true});
            
    //     }
    //          console.log("Results:"+result);
    //         res.redirect('category');

    // },
    editCategoryPost: async  (req,res,next)=>{

        console.log('title = ',req.body);
        const catid = req.body.catid;

        let currentCategory =  await CategoryModel.findOne({_id: catid})

        if(req.body.offerToggler){
            
            var result = await CategoryModel.updateOne({  _id: Object(catid) },{'categoryTitle': req.body.title,
                            categoryTitle: req.body.title,
                            offerStart: req.body.startDate,
                            offerEnd: req.body.endDate,
                            discount: parseInt(req.body.percentage),
                            offerActive: true,
                            categoryActive: true
                        } ,
                            {upsert: true});
    

            let productUpdate= await ProductsModel.updateMany({'category': currentCategory.categoryTitle},
                        {category:req.body.title , categoryOfferActive : true,categoryOffer : 
                            {
                                offerStart: req.body.startDate,
                                offerEnd: req.body.endDate,
                                discount: parseInt(req.body.percentage),
                                offerActive: true,
                            }
                        })
            

        }else{
            let productUpdate= await ProductsModel.updateMany({'category': currentCategory.categoryTitle},
                        {category:req.body.title , categoryOfferActive : false ,$unset:{categoryOffer:''} })
            var result = await CategoryModel.updateOne({  _id: Object(catid) },
            {'categoryTitle': req.body.title,offerActive: false,categoryActive: true ,
            $unset:{ 'discount':'','offerStart':'','offerEnd':'' } } ,{upsert: true});
        }

        const getOldImg = await CategoryModel.findOne({  _id: Object(catid) });



        if(req.file)
        {
            if (fs.existsSync('./public/uploads/categories/'+getOldImg.image)) {  //Check if file exists
                fs.unlinkSync('./public/uploads/categories/'+getOldImg.image)
              }
            const result = await CategoryModel.updateOne({  _id: Object(catid) },{'image': req.file.filename} ,{upsert: true});
        } 

        console.log("ResultssW = ",result);
        res.redirect('category')
        
    },





    //   Admin
    adminLoginView : (req,res)=>{
        res.render('admin/login',{layout:'admin/login'})
    },
    adminLoginPost :async (req,res,next) =>{
        console.log('d');
        const adminEmail = 'admin@gmail.com'
        const adminPassword = 'admin'
        console.log('df ' , req.body);
        const email=req.body.email;
        const pass=req.body.password;
        if(adminEmail == email && adminPassword == pass){
            req.session.userEmail = req.body.email;
            req.session.loggedIn = true;
            req.session.admin = true;
            res.redirect('/admin')
        }else{
            res.render('admin/login',{layout:'admin/login',error:true, msg: 'Invalid username or password'})
        }
        
    },

    adminLogout : (req,res)=>{
        console.log('out');
        req.session.destroy((err)=>{
            if(err) console.log("Error loging out : ",err)
            else res.redirect('admin-login')
        })
    },
    // user
    usersView: async (req,res) =>{
    const users= await UsersModel.find({}).sort({_id:-1});
    res.render('admin/users',{users})

    },
    blockUser: async (req,res,next)=>{
      let uId  = req.query.id;
      const result= await UsersModel.updateOne({ _id:Object(uId)},{'active':false}, {upsert:true});
      console.log("Results:" , +result);
      res.redirect('users')

    },
    unBlockUser: async(req,res,next)=>{
        let uId =req.query.id;
        const result= await UsersModel.updateOne({_id:Object(uId)},{'active':true},{upsert:true});
        console.log("Results:" , +result);
        res.redirect('users')
    },




     // Products
     addProductGet :(req,res)=>{
        res.render('admin/add-product')
    },


    viewProducts : async(req,res)=>{

        const products = await ProductsModel.find({}).sort({_id:-1})
        res.render('admin/admin-view-products',{products})
    },
    addProductsGet : async(req,res)=>{
        const categories=await CategoryModel.find({})
        res.render('admin/add-product',{categories})
    },
    addProductPost : async(req,res)=>{
        const categories=await CategoryModel.find({})
        
        var img1,img2, img3, img4;
        if(req.files[0]!=undefined)   img1= req.files[0].filename
        if(req.files[1]!=undefined)   img2=req.files[1].filename
        if(req.files[2]!=undefined)   img3=req.files[2].filename
        if(req.files[3]!=undefined)   img4=req.files[3].filename
                const  product = new ProductsModel({
                    title:req.body.title,
                    brand:req.body.brand,
                    price:req.body.price,
                    category:req.body.category,
                    description:req.body.description,
                    img1: img1,
                    img2: img2,
                    img3: img3,
                    img4: img4,
                    stock: req.body.stock
                })
                const result=await product.save();
                console.log('result= ',result);
                res.redirect('view-products')

 
    },
    
    editProductGet : async (req,res)=>{
        let catId= req.query.id;
        const product =await ProductsModel.findOne({_id:Object(catId)})
        const categories=await CategoryModel.find({})
        res.render ('admin/edit-product',{product,categories})
    },
     
    // Edit Product

    editProductPost : async(req,res) =>{
        try {
            console.log('body = ',req.body);
            let proData = req.body
            console.log('body = ',proData.title);
            let images = req.files
            let id = proData.id
            
            // req.flash('message', 'Welcome to Blog');

            var img1, img2, img3, img4;
            if (images.image1!=undefined)   img1 = images.image1[0].filename
            if (images.image2!=undefined)   img2 = images.image2[0].filename  
            if (images.image3!=undefined)   img3 = images.image3[0].filename
            if (images.image4!=undefined)   img4 = images.image4[0].filename
                    
            console.log('hehe');
            let result = await ProductsModel.findByIdAndUpdate({_id:Object(proData.prdId)}, {
                title: proData.title,
                category: proData.category,
                // gender: proData.gender,
                brand: proData.brand,
                price: proData.price,
                description: proData.description,
                img1: img1,
                img2: img2,
                img3: img3,
                img4: img4,
                stock: proData.stock
            })
            console.log('result = ',result);
            res.redirect('view-products');
        } catch (error) {
                res.send('Error Occured')
        }
    },
    // deleteProduct : async(req,res)=>{
    //     const productId = req.query.id;
    //     const product = await ProductsModel.deleteOne({_id: Object(productId)})
    //     res.redirect('view-products')
    // },

    deleteProduct : async(req,res)=>{
        try {
            const productId = req.body.productId;
            const product = await ProductsModel.deleteOne({_id: Object(productId)})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },

    ordersViewAdmin : async(req,res)=>{
        res.locals.moment = moment;
        let orders = await OrdersModel.find({}).sort({date:-1})

        let cartIds = await OrdersModel.distinct('cartId')
        cartIds.reverse()
        console.log('orderzzzz',orders)
         

        res.render('admin/orders-admin',{orders,cartIds})
    },
    changeOrderStatus: async(req,res)=>{
        console.log('hsdfdffffff');
        try {
            console.log('body = ',req.body);
            const orderId = req.body.order;
            const status = req.body.status;
            let result = await OrdersModel.updateOne({  _id: Object(orderId)  },{'status': status}); 
            const order = await OrdersModel.findOne({ _id: Object(orderId) });
            const userDetails = await UsersModel.findOne({_id: Object(order.userId)})
            let returnPrice = parseInt(order.amount)

            if(req.body.status=="cancelled"){
                if(order.paymentMode!='cod' ){
                    if(userDetails.wallet!=undefined){
                        let wallet= userDetails.wallet
                        wallet = parseInt(wallet)+parseInt(returnPrice)
                        let result2 = await UsersModel.updateOne({_id:Object(order.userId)},{wallet:wallet},{upsert:true})
                    }
                    else{
                        let result2 = await UsersModel.updateOne({_id:Object(order.userId)},{wallet:returnPrice},{upsert:true})
                    }
                }
            }
            console.log('result = ',result);
            res.status(200).send({success:true,message:  'Edit Success'})
        } catch (error) {
            res.status(400).send({success:false,message:  'Error updating status'})
        }
    },
    viewOrderedProduct: async(req,res)=>{
        const orderId = req.query.id;
        const result = await OrdersModel.findOne({_id:Object(orderId)})
        console.log('resss = ',result.items);
        res.render('admin/ordered-products-admin',{orederdItems: result.items})        
    },

    addbannerview : (req,res)=>{
        res.render('admin/banner/add-banner')
    },
    
    addbannerviewPost: async(req,res)=>{
        let img1
        if(req.file!=undefined)  
        {
            console.log('ssss');
            img1=req.file.filename
        }
        console.log('197 = ',req.file);
        console.log(req.body);
        const banner = new BannerModel({
            title1: req.body.title1,
            title2:req.body.title2,
            url: req.body.url,
            image:img1
            // active: true
        }) 
    
        const result = await banner.save();
        console.log('res:'+result);

        res.redirect('banners')
    },


    
    bannersView: async(req,res)=>{
       
         try{
            let banners = await BannerModel.find({}).sort({_id:-1})
             res.render('admin/banner/banners',{banners})
        }catch(error){
            res.render('layouts/somethingWentWrong')
            console.log('banners = ',banners);
        }
       
    },

    editBannerView : async( req,res)=>{
        try {
            let banner = await BannerModel.findOne({_id: Object(req.query.id)})
            console.log('banner = ',banner);
            res.render('admin/banner/edit-banner',{banner})
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }
    },
    editBannerPost : async(req,res)=>{
        try {

        let img1
        let currentBanner = await BannerModel.findOne({_id: Object(req.body.bannerId)})
        if (req.file!=undefined)    img1 = req.file.filename

            console.log('body - ',req.body);

            const result = await BannerModel.updateOne({  
                _id: Object(req.body.bannerId) },{
                    title1: req.body.title1,
                    title2: req.body.title2,
                    url: req.body.url,
            } ,{upsert: true})

            if(req.file){
                if (fs.existsSync('./public/uploads/banner/'+currentBanner.image)) {  //Check if file exists
                    fs.unlinkSync('./public/uploads/banner/'+currentBanner.image)
                  }
                const result = await BannerModel.updateOne({  _id: Object(req.body.bannerId) },{'image': req.file.filename} ,{upsert: true});
            }
            res.redirect('banners')
                        
        } catch (error) {
            res.render('layouts/somethingWentWrong')
        }
    },
    deleteBanner : async(req,res)=>{
        console.log('d');
        try {
            const bannerId = req.body.bannerId;

            console.log('535 ',Object(bannerId));
            const result = await BannerModel.deleteOne({_id: Object(bannerId)})

            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },
    stockUpdate: async(req,res)=>{
        try {
            let result = await ProductsModel.updateOne({_id:Object(req.body.productId)},{stock:req.body.stock})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            
        }
    },
    couponsGet : async(req,res,next)=>{
        let coupons = await CouponsModel.find({}).sort({_id:-1})
        res.render('admin/coupons',{coupons})
    },
    addCouponsGet : (req,res,next)=>{
        res.render('admin/add-coupon')
    },
    addCouponsPost :   async(req,res,next)=>{
        
        console.log('344');
        console.log(req.body);

        // let img1
        let count = await CouponsModel.find({coupon:req.body.coupon}).count();

        if(count==0){

            const couponT = new CouponsModel({
                coupon: req.body.coupon,
                start: req.body.startDate,
                end: req.body.endDate,
                percentage: req.body.percentage
            }) 
    
            const result = await couponT.save();
            console.log('result = ',result);
    
            res.redirect('coupons')
        }else{
            res.render('admin/add-coupons',{error:true,msg:'Coupon already exists!'})
        }


    },
    editCouponGet : async(req,res)=>{
        let couponId = req.query.id;
        let coupon = await CouponsModel.findOne({_id: Object(couponId)})
        console.log('cou ',coupon);
        res.render('admin/edit-coupon',{coupon})
    },
    editCouponPost: async(req,res)=>{
        console.log(req.body);

        const result = await CouponsModel.updateOne({  
            _id: Object(req.body.couponId) },{'coupon': req.body.coupon,
            'start':req.body.startDate,
            'end': req.body.endDate,
            'percentage': req.body.percentage
        } ,{upsert: true});

        res.redirect('coupons')

    },
    deleteCoupon: async(req,res,next)=>{
        try {
            const couponId = req.body.couponId;
            const coupon = await CouponsModel.deleteOne({_id: Object(couponId)})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },
    offerProductsGet : async(req,res,next)=>{
        let productsOffer = await OfferProductsModel.find({}).sort({_id:-1})
        
        let products = await OfferProductsModel.aggregate([ 
            {$project: { product:'$product',start : '$start',end:'$end',offerPercentage:'$offerPercentage' } } ,  
            { $lookup: 
                {from:"products", localField: "product", foreignField:"_id", as: "productss", } 
            } ])  




        res.render('admin/offers/products-offer',{productsOffer,products})
    },
    addProductOfferGet : async(req,res)=>{
        try {
            let products = await ProductsModel.find({productOfferActive: {$ne: true}})
            res.render('admin/offers/add-product-offer',{products})
        } catch (error) {
            res.send('Something Went wrong!!'+error)
        }
    },
    addProductOfferPost :async(req,res)=>{
        try {
            let percentage = parseInt(req.body.percentage)
            let productId = ObjectId(req.body.product);
            console.log('486 ',productId);

            let productDetails = await ProductsModel.findOne({_id: Object(req.body.product)})
            console.log('481',productDetails);
            const productOffer = new OfferProductsModel({
                product: Object(req.body.product),
                productTitle: productDetails.title,
                start: req.body.startDate,
                end: req.body.endDate,
                offerPercentage: percentage,
                active: true
            }) 
            console.log('493');
            
            const result2 = await productOffer.save();
            let result = await ProductsModel.updateOne({_id: Object(req.body.product)},{productOffer:productOffer,productOfferActive: true},{upsert: true})
            
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(200).send({success:false,message: 'Something went wrong'})
        }
    },
    editOfferProductsGet: async(req,res)=>{
        let products = await ProductsModel.find({productOfferActive: {$ne: true}})
        let offerId = req.query.id;
        let productOffer = await OfferProductsModel.findOne({_id: Object(offerId)})
        res.render('admin/offers/edit-product-offer',{products,productOffer})
    },
    editOfferProductsPatch: async(req,res)=>{
        try {
            // let result = await ProductsModel.updateOne({_id: Object(req.body.product)},{productOffer:req.body,productOfferActive: true},{upsert: true})
            let productId = ObjectId(req.body.product);

            let productDetails = await ProductsModel.findOne({_id: Object(req.body.product)})
            let percentage = parseInt(req.body.percentage)
            console.log('481',productDetails);

            const offer= await OfferProductsModel.updateOne({_id: Object(req.body.offerId)},
                {   
                    product: Object(req.body.product),
                    productTitle: productDetails.title,
                    start: req.body.startDate,
                    end: req.body.endDate,
                    offerPercentage: percentage,
                    active: true
                }
            )
            let updateProduct = await ProductsModel.updateMany({_id: Object(req.body.product)},{
                productOffer:{
                    product: Object(req.body.product),
                    productTitle: productDetails.title,
                    start: req.body.startDate,
                    end: req.body.endDate,
                    offerPercentage: percentage,
                    active: true
                }
            },{$upsert: true})
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            res.status(200).send({success:false,message: 'Something went wrong'})
        }
    },
    deleteOfferProduct: async(req,res)=>{
        console.log('531');
        try {
            const offerId = req.body.offerId;

            console.log('535',offerId);
            console.log('535',Object(offerId));
            const result = await OfferProductsModel.deleteOne({_id: Object(offerId)})

            const result2 = await ProductsModel.updateOne({_id: Object(req.body.productId)},{$unset:{productOffer:''},productOfferActive:false})
            console.log('536');
            res.status(200).send({success:true,message: 'Success'})
        } catch (error) {
            console.log('540 '+error);
            res.status(400).send({success:false,message: 'Something went wrong'})
        }
    },

   




     // Sales Report
     viewSalesManagement : async (req, res) => {
        //console.log('561');
        const data = await salesHelpers.monthlyReport()
        const daily = await salesHelpers.dailyReport()
        const weekly = await salesHelpers.weeklyReport()
        const yearly = await salesHelpers.yearlyReport()
        // const categWise = await salesHelpers.categoryWiseSales()
        // res.render('admin/salesReport', {data, daily, weekly, yearly, categWise})
        res.render('admin/salesReport', {data, daily, weekly, yearly})
        // res.render('admin/salesReport')
    }


}



     


    


   


    




module.exports = admincontroller;




//Redirect,href ==> routing
//Render ==> view page