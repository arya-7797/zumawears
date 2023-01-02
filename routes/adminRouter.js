const express = require('express')
const router = express.Router()
const admincontroller=require('../controller/admincontroller')
const multer = require('multer')
const adminHelper = require('../helpers/adminHelper')
const salesController = require('../controller/salesManagementController')
const moment = require('moment');
const bodyParser = require('body-parser')

// Setting layout for the admin pages
const setAdminLayout = (req, res, next) => {
    res.locals.layout = 'layouts/adminLayout'
    next()
}
router.use(setAdminLayout)


/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
// Add Category
const categoryStorage = multer.diskStorage({
    destination: (req,file,callback)=>{
        callback(null,'./public/uploads/categories')
    },

    //extension
    filename: (req,file,callback)=>{
        callback(null,Date.now()+file.originalname)
    }
})

//upload parameters for multer
const upload = multer({
    storage: categoryStorage,
    limits:{
        fieldSize: 1024*1024*5
    }
})


///////////////////////////////////////////////////////////
///////////////////PRODUCT MULTER STARTS///////////////////
///////////////////////////////////////////////////////////
////Defining storage for Images////

const productStorage = multer.diskStorage({
    destination: (req,file,callback)=>{
        callback(null,'./public/uploads/products')
    },

    //extention
    filename: (req,file,callback)=>{
        callback(null,Date.now()+file.originalname)
    }
})

//upload parameters for multer
const uploadPrdt = multer({
    storage: productStorage,
    limits:{
        fieldSize: 1024*1024*5
    }
})
////////////////////////////////////////////////
////////////////////////////////////////////////

const storageEngine = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "./public/uploads/categories") },
    filename: (req, file, cb) => { cb(null, file.originalname) }, 
})

const imageFilter = (req, file, cb) => {
    if ( file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype == "image/jpg") {
        cb(null, true) } else { cb(null, false)}
    }

uploadHandler = multer({ storage: storageEngine, fileFilter: imageFilter })



const adminLoginCheck = ((req,res,next)=>{

    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    if(!req.session.loggedIn)
        res.redirect('admin-login')
    else if(!req.session.admin)
        res.redirect('/')
    else
        next();
})

const forLogin =  ((req,res,next)=>{
    if(req.session.loggedIn&&req.session.admin)
        res.redirect('/admin')
    else if(req.session.loggedIn &&  !req.session.admin)
        res.redirect('/')
    else
        next();
}) 








// Users

router.get('/admin-login',forLogin,admincontroller.adminLoginView)
router.post('/admin-login',forLogin,admincontroller.adminLoginPost)
router.get('/users',adminLoginCheck,admincontroller.usersView)
router.get('/block-user',adminLoginCheck,admincontroller.blockUser)
router.get('/unblock-user',adminLoginCheck,admincontroller.unBlockUser)
router.get('/admin-logout',adminLoginCheck,admincontroller.adminLogout)


// Products

router.get('/',adminLoginCheck,admincontroller.dashboard)
// router.get('/add-product',admincontroller.addProductGet)
router.get('/view-products',adminLoginCheck,admincontroller.viewProducts)
router.post('/add-product',adminLoginCheck,uploadPrdt.array('image1',4),admincontroller.addProductPost)
router.get('/add-product',adminLoginCheck,admincontroller.addProductsGet)
router.get('/edit-product',adminLoginCheck,admincontroller.editProductGet)
router.delete('/delete-product',adminLoginCheck,admincontroller.deleteProduct)

// orders

router.get('/orders',adminLoginCheck,admincontroller.ordersViewAdmin)
router.post('/change-order-status',adminLoginCheck,admincontroller.changeOrderStatus)
router.get('/view-order-products',adminLoginCheck,admincontroller.viewOrderedProduct)



// Sales-report

router.get('/sale-report',adminLoginCheck,admincontroller.viewSalesManagement)

//banner
// ///////////////////////////
    // Banner
    const bannerStorage = multer.diskStorage({
        destination: (req,file,callback)=>{
            callback(null,'./public/uploads/banner')
        },

        //extention
        filename: (req,file,callback)=>{
            callback(null,Date.now()+file.originalname)
        }
    })

    //upload parameters for multer
    const upload2 = multer({
        storage: bannerStorage,
        limits:{
            fieldSize: 1024*1024*5
        }
    })
    // BANNER END
// //////////////////////////

router.get('/add-banner',admincontroller.addbannerview)
router.post('/add-banner',upload2.single('image'),admincontroller.addbannerviewPost)
router.get('/banners',admincontroller.bannersView)
router.get('/edit-banner',admincontroller.editBannerView)
router.post('/edit-banner',upload2.single('image'),admincontroller.editBannerPost)
router.delete('/delete-banner',admincontroller.deleteBanner)


// stock-update
router.patch('/stock-update',admincontroller.stockUpdate)


// coupons

router.get('/coupons',adminLoginCheck,admincontroller.couponsGet)
router.get('/add-coupons',adminLoginCheck,admincontroller.addCouponsGet)
router.post('/add-coupon',adminLoginCheck,admincontroller.addCouponsPost)
router.get('/edit-coupon',adminLoginCheck,admincontroller.editCouponGet)
router.post('/edit-coupon',adminLoginCheck,admincontroller.editCouponPost)
router.delete('/delete-coupon',adminLoginCheck,admincontroller.deleteCoupon)

//offers

router.get('/offer-products',adminLoginCheck,admincontroller.offerProductsGet)
router.get('/add-product-offer',adminLoginCheck,admincontroller.addProductOfferGet)
router.post('/add-product-offer',adminLoginCheck,admincontroller.addProductOfferPost)
router.get('/edit-offer-product',adminLoginCheck,admincontroller.editOfferProductsGet)
router.patch('/edit-product-offer',adminLoginCheck,admincontroller.editOfferProductsPatch)
router.delete('/delete-product-offer',adminLoginCheck,admincontroller.deleteOfferProduct)



//Category
router.get('/add-category',adminLoginCheck,admincontroller.addCategoryGet)
router.post('/add-category',upload.single('image'),admincontroller.addCategoryPost)
router.get('/category',adminLoginCheck,admincontroller.categoriesView)
router.delete('/delete-category',adminLoginCheck,admincontroller.deleteCategory)
router.get('/edit-category',adminLoginCheck,admincontroller.editCategoryGet)
router.post('/edit-category',upload.single('image'),admincontroller.editCategoryPost)

//Edit Product
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        
        cb(null, './public/uploads/products')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    }
})
const filefilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const uploadImage =multer({ storage: storage , fileFilter : filefilter})
const uploadMultipleFiled = uploadImage.fields([{name:'image1', maxCount:1}, {name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}])
router.post('/edit-product',uploadMultipleFiled, admincontroller.editProductPost)
  



module.exports = {
    routes: router
}
