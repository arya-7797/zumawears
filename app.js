 if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()  
 }

const express=require('express')
const app=express()
const session         = require('express-session')
const expressLayouts=require('express-ejs-layouts')
const bodyParser = require('body-parser')
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')
const CartModel = require('./models/Cart');
const Register = require('./models/user');

app.set('view engine', 'ejs')
app.set('views',__dirname+'/views')
app.set('layout', 'layouts/usersLayout') 
app.use(expressLayouts)
app.use(express.static('public'))

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
}))
app.use(function(req, res, next) {
    res.locals.loggedIn = req.session.loggedIn;
    res.locals.user = req.session.user;
    next();
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))


// app.use(express.static(path.join(__dirname,'public'))) 


const mongoose=require('mongoose')
mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true})
const db= mongoose.connection
db.on('error',error => console.error(error))
db.once('open',() => console.error('Connected to Mongoose'))

app.use('/',userRouter)
app.use('/admin',adminRouter.routes)
app.use('*',(req,res)=>{
    res.render('users/error404')
})



app.listen(process.env.PORT || 3000)