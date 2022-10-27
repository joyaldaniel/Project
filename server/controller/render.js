const User = require("../model/userModel")
const Admin = require('../model/adminModel');
const Product=require('../model/productsModel')
const Cart = require('../model/cartModel')
const CartProduct = require('../model/cart')
const Wishlist = require('../model/wishlistModel')
const Order = require('../model/orderModel')
const Category = require('../model/categoryModel')
const Coupon = require("../model/couponModel")
const {ObjectId} = require('bson')
const otp = require('../middleware/otp')
const Razorpay = require('razorpay');
const Paypal = require('paypal-rest-sdk')
const { ExportConfigurationInstance } = require("twilio/lib/rest/bulkexports/v1/exportConfiguration");
const coupondb = require("../model/couponModel");
const orderHelpers =require('../helpers/orderHelpers');
const excelJs = require('exceljs')
let session;

let validation = {
        category : false,
        existingCoupon : false,
        validCoupon : false,
        usedCoupon : false,
        dateExpiry : false,
        amountMin : false,

}

exports.isLoggedIn=(req,res,next)=>{
        session = req.session
        if(session.userId){
                next()
        }else
        res.redirect('user_signin')
}
exports.isLoggedOut=(req,res,next)=>{
        session = req.session
        if(!session.userId){
                next()
        }else
        res.redirect('user_home')
}
exports.adminLoggedIn=(req,res,next)=>{
        session = req.session
        if(session.adminId){
                next()
        }else
        res.redirect('admin_signin')
}
exports.adminLoggedOut=(req,res,next)=>{
        session = req.session
        if(!session.adminId){
                next()
        }else
        res.redirect('admin_panel')
}

exports.loginRouter=(req,res)=>{
        let response=({
                blockStatErr :req.query.blockstatus,
                blockStatErrMsg:'admin have blocked this user',
                passErr : req.query.pass,
                passErrMsg : "Password Incorrect",
                registerErr : req.query.register,
                registerErrMsg :"User not found"
        })

        
        session=req.session
        if(session.userId){
                res.redirect('user_home')
        }else{
                res.render('user/login',{response})

        }
}
exports.adminLoginRouter=(req,res)=>{
        let response=({
                passErr : req.query.pass,
                passErrMsg :"Invalid Admin or Password",
                registerErr : req.query.register,
                registerErrMsg: "Invalid Admin or Password"
        })
        res.render('admin/login',{response})
}


exports.signupRouter=(req,res)=>{  
        let response=({
               
                passErr : req.query.pass,
                passErrMsg :"Invalid Password",
                accountErr : req.query.account,
                accountErrMsg: "User already Registered"
        })     
        res.render('user/signup',{response})
}

exports.userHome = (req, res) => {
       if(req.query.category){
        Product.find({category : req.query.category})
                .then((result) => {
                        Category.find()
                                .then((item) => {
                                        res.render('user/home',{result,item});      
                                })
                })
       }else{
        
        Category.find()
        .then((item)=>{
                Product.find()
                .then((result)=>{
                if(result){
                        res.render('user/home',{result,item});    
                }
        }).catch((err)=>console.log(err))

        })
}
       
    }


    exports.userhome = (req, res) => {
       if(req.query.category){
        Product.find({category : req.query.category})
                .then((result) => {
                        Category.find()
                                .then((item) => {
                                        res.render('user/home',{result,item});      
                                })
                })
       }else{
        
        Category.find()
        .then((item)=>{
                Product.find()
                .then((result)=>{
                if(result){
                        res.render('user/home',{result,item});    
                }
        }).catch((err)=>console.log(err))

        })
}
       
    }

exports.cart=(req,res)=>{
        Category.find()
        .then((item)=>{
                Cart.findOne({ owner : req.session.userId})
                .then((result)=>{
                        if(result){
                                res.render('user/cart',{result,item})
                              
                        }else
                            res.render('user/cart',{result : {items:[]},item})
                        
                })
                .catch((err)=>{
                        console.log(err)
                })
        })
       
}


exports.addToCart = (req, res) => {
        let session = req.session
        let user = session.userId
        Cart.findOne({ owner : user })
            .then((result)=>{
                if(result){
                        Cart.findOne({ "items.itemId" : req.query.id})
                            .then((oldCart)=>{
                                if(oldCart){
                                    let cart = new CartProduct(oldCart)
                                    let cartItem = cart.add(req.query.id)
                                    cartItem.then((cartItem)=>{
                                        let newCart = oldCart;
                                        let indexOfOldItem = 0;
                                        for(let i=0;i<newCart.items.length;i++){
                                            if(req.query.id.includes(newCart.items[i].itemId)){
                                                indexOfOldItem =i;
                                                break;
                                            }                                               
                                        }
                                        newCart.items.splice(indexOfOldItem,1,cartItem[0]);
                                        Cart.replaceOne({owner : oldCart.owner},{
                                                owner : newCart.owner,
                                                items : newCart.items,
                                                bill : cart.bill
                                        })
                                         .then(()=>res.redirect('/user_home'))
                                    })
                                }else{
                                        Product.findOne({_id : req.query.id})
                                               .then((product)=>{
                                                let newCartItem ={
                                                        itemId : product._id,
                                                        productName : product.productName,
                                                        quantity : 1,
                                                        price : product.discountedPrice,
                                                        category : product.category,
                                                        image1 : product.image1,
                                                        orderStatus : "none"
                                                       
                                                }
                                                let newCart = result;
                                                newCart.items.push(newCartItem)
                                                totalBill = +newCart.bill + +newCartItem.price
                                                newCart.bill = totalBill;
                                                Cart.replaceOne({owner : user},{
                                                        owner : newCart.owner,
                                                        items : newCart.items,
                                                        bill: newCart.bill
                                                })
                                                        .then(()=> res.redirect('/user_home'))
                                               })
                                }
                            })
                }else{
                        Product.findOne({_id : ObjectId(req.query.id)})
                               .then((product)=>{
                                let cart = new Cart({
                                        owner : user,
                                        items :[{
                                                itemId : product._id,
                                                productName : product.productName,
                                                quantity : 1,
                                                price : product.discountedPrice,
                                                category:product.category,
                                                image1 : product.image1,
                                                orderStatus : "none"
                                        }]
                                })
                                cart.bill = cart.items[0].quantity * cart.items[0].price
                                cart.save()
                                    .then(()=> res.redirect('/user_home'))
                               })
                }
            })
        }


exports.cartOperation = (req,res)=>{

        Cart.findOne({ owner : req.session.userId})
        .then((oldCart)=>{
                let operations =(cartItem)=>{
                        let newCart=oldCart
                        let indexOfOldItem=0;
                        for(let i=0 ; i<newCart.items.length ;i++ ){
                                if(req.query.id.includes(newCart.items[i].itemId)){
                                        indexOfOldItem = i;
                                        break;
                                }
                        }
                        if(cartItem[0].quantity>0){
                                newCart.items.splice(indexOfOldItem,1,cartItem[0])
                                Cart.replaceOne({ owner : oldCart.owner},{
                                        owner : newCart.owner,
                                        items : newCart.items,
                                        bill  : cart.bill
                                })
                                .then(()=>{
                                        res.redirect('/cart')
                                })
                        }else{
                                newCart.items.splice(indexOfOldItem,1)
                                Cart.replaceOne({owner : oldCart.owner},{
                                        owner : newCart.owner,
                                        items : newCart.items,
                                        bill  : cart.bill
                                })
                                .then(()=>{
                                        Cart.findOne({owner : oldCart.owner})
                                            .then((result)=>{
                                                if(result.items.length <1){
                                                        Cart.deleteOne({owner:oldCart.owner})
                                                            .then(()=>{
                                                                res.redirect('/cart')
                                                            })
                                                }else{
                                                        res.redirect('/cart')
                                                }
                                            })
                                })
                        }
                }

                let cart=new CartProduct(oldCart)
                if(req.query.add){
                        let cartItem = cart.add(req.query.id)
                        cartItem.then((cartItem)=>{
                                operations(cartItem)
                        })
                }else{
                        let cartItem = cart.substract(req.query.id)
                        cartItem.then((cartItem)=>{
                                operations(cartItem)
                        })
                }
        })
}



exports.deleteFromCart=(req,res)=>{
        Cart.findOne({owner : req.session.userId })
            .then((result)=>{
                let indexOfOldItem = 0;
                for(let i=0;i<result.items.length;i++){
                        if(req.query.id.includes(result.items[i].itemId)){
                                indexOfOldItem=i;
                                break;
                        }
                }
                let cartBill = +result.bill - +result.items[indexOfOldItem].price
                result.items.splice(indexOfOldItem,1);
                Cart.replaceOne({ owner : result.owner},{
                        owner : result.owner,
                        items : result.items,
                        bill : cartBill
                })
                .then(()=>{
                        Cart.findOne({owner :req.session.userId})
                        .then((result)=>{
                                if(result.items.length <1){
                                        Cart.deleteOne({ owner : req.session.userId})
                                            .then(()=>{
                                                res.redirect('/cart');
                                            })
                                }else{
                                        res.redirect('/cart')
                                }
                        })
                })

            })
}



exports.productView=(req,res)=>{
        let id = req.query.id
        Category.find()
        .then((item)=>{
                Product.findOne({_id : ObjectId(id)})
                .then((result)=>{
                        // console.log(result)
                        res.render('user/productView',{result,item})
                })   
        })
           
}

exports.applyCoupon=(req,res)=>{
        let coupon = req.body.couponcode
        Cart.findOne({owner : req.session.userId})
        .then((cart)=>{
                Coupon.findOne({couponCode : coupon })
                .then((coupons)=>{
                        if(coupons){
                                Coupon.findOne({couponCode : req.body.couponcode , users : req.session.userId })
                                .then((usedCoupon)=>{
                                        console.log(usedCoupon)
                                        if(usedCoupon){
                                                validation.usedCoupon = true
                                                // res.redirect('/cart')
                                                res.json({})
                                        }else{
                                                if(coupons.couponExpiry >= Date.now()){
                                                        if(coupons.minBill >= cart.bill){
                                                                validation.amountMin = true
                                                                // res.redirect('/cart')   
                                                                res.json({}) 
                                                        }else{
                                                                req.session.coupon = coupons
                                                               
                                                                res.json({couponValue: coupons.couponValue , couponCode : coupons.couponCode})
                                                        }
                                                }else{
                                                        validation.dateExpiry = true
                                                        // res.redirect('/cart')  
                                                        res.json({}) 
                                                }
                                        }
                                        
                                }).catch((err)=>console.log(err))
                        }else{
                                validation.validCoupon = true
                                // res.redirect('/cart')  
                                res.json({}) 
                        }
                })
             
        })
       
       
}


exports.myAccount=(req,res)=>{
        Category.find()
        .then((item)=>{
                res.render('user/myAccount',{item})
        })
       
}

exports.allOrders=(req,res)=>{
        Category.find()
        .then((item)=>{
                
                Order.find({owner : req.session.userId})
        .then((result)=>{
                console.log(result);
                res.render('user/allOrders',{result,item})
        })        
        })
        
}
exports.orderStatus=(req,res)=>{
        Category.find()
        .then((item)=>{
                Order.findOne({ _id : req.query.id})
                .then((order)=>{
                res.render('user/orderStatus',{order,item})
        })
        
        })
        
}

exports.cancelOrder=(req,res)=>{
        let itemId=req.query.itemId;
        let orderId=req.query.orderId;
        console.log(itemId)
        console.log(orderId)
    
        Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Cancel'}})
            .then(()=>{
                res.redirect(`/orderStatus?id=${orderId}`)
            })
            .catch((err)=>console.log(err))
    }



exports.checkout = (req, res) => {
        Category.find()
        .then((item)=>{
                User.findOne({ email : req.session.userId })
            .then((user) => {
                Cart.findOne( { owner : req.session.userId })
                    .then((cart) => {
                        let userAddress = user.address
                        if(cart) {
                            if(user.address.length) {
                                res.render('user/checkout', { cart, userAddress,item })
                            }else{
                                res.redirect('/cart/checkout/shipping/add-new-address?userAddress=false')
                            }
                        }else
                            if(user.address.length) {
                                res.render('user/checkout', { cart : { items : [] }, userAddress,item })
                            }else{
                                res.redirect('/cart/checkout/shipping/add-new-address?userAddress=false')
                            }
                    })
            })
        })
        
    }

    exports.wishlist = (req, res) => {
        Category.find()
        .then((item)=>{
                Wishlist.findOne({owner : req.session.userId})
                .then((result)=>{
                    if(result){
                        res.render('user/wishlist',{result,item})
                     }else{
                        res.render('user/wishlist',{result : {items : []},item})
                     }
                })

        })
       
    }

    exports.addToWishlist = (req,res) =>{
        let session = req.session
        let user = session.userId
        Wishlist.findOne({owner : user})
        .then((result)=>{           
            if(result){
                Wishlist.findOne({"items.itemId" : req.query.id})
                .then((wishlist)=>{                    
                    if(wishlist){
                        let  newWishlist = wishlist                       
                        let indexOfOldItem = 0;
                        for(let i=0;i<newWishlist.items.length;i++){
                            if(req.query.id.includes(newWishlist.items[i].itemId)){
                                indexOfOldItem = i;
                                break;
                            }
                        }
                        newWishlist.items.splice(indexOfOldItem, 1);
                        Wishlist.updateOne({owner : user},{$set:newWishlist})
                        .then(()=>{
                            if(newWishlist.items.length<1){
                                Wishlist.deleteOne({owner : user})
                                .then(()=>{
                                    if(req.query.wishlist){
                                        res.redirect('/user_home')
                                    }else{
                                        res.redirect('/user_home')
                                    }
                                    
                                })
                            }
                        })
                    }else{
                        let newWishlist = result;
                        Product.findOne({_id : req.query.id})
                        .then((product)=>{
                            let newWishItem = {
                                itemId : product._id,
                                productName : product.productName,
                                category : product.category,
                                image1 : product.image1,
                                price : product.discountedPrice,
                            
                            }
                                result.items.push(newWishItem)
                                Wishlist.updateOne({owner : user},{$set:{items : newWishlist.items}})
                                .then(()=>{
                                    res.redirect('/user_home')
                        })
                        })
                        
                    }
                        
                })
                
            } else{
                Product.findOne({_id: ObjectId(req.query.id)})
                .then((product)=>{
                 let wish = new Wishlist({
                     owner : user,
                     items :[{
                         itemId : product._id,
                         productName : product.productName,
                         category : product.category,
                         image1 : product.image1
                     }]
                 }) 
                 wish.save()
                 .then(()=>{
                     res.redirect('/user_home')
                 })
                })
                }
            })
        }  

        exports.deleteFromWishlist = (req,res) =>{
                Wishlist.findOne({owner : req.session.userId})
                .then((result)=>{
                //  console.log(result)
                 let indexOfOldItem = 0;
                 for(let i=0;i<result.items.length;i++){
                     if(req.query.id.includes(result.items[i].itemId)){
                         indexOfOldItem = i;
                         break;
                     }
                 }
                 result.items.splice(indexOfOldItem,1);
                     Wishlist.replaceOne({owner : result.owner},{
                         owner : result.owner,
                         items : result.items,
                     })
                     .then(()=>{
                         Wishlist.findOne({owner : req.session.userId})
                         .then((result)=>{
                             if(result.items.length<1){
                                 Wishlist.deleteOne({owner : req.session.userId})
                                 .then(()=>{
                                     res.redirect('/wishlist');
                                 })
                             }else{
                                 res.redirect('/wishlist');
                             }
                         })
                     })
         
                }) 
         }


    exports.addAddress = (req, res) => {
        Category.find()
        .then((item)=>{
                Cart.findOne({ owner : req.session.userId })
            .then((cart) => {
                let userAddress = req.query.userAddress ? true : false;
                if(cart) {
                    if(userAddress) {
                        res.render('user/addAddress', { cart, userAddress ,item })
                    }else{
                        res.render('user/addAddress', { cart,item })
                    }
                }else{
                    res.render('user/addAddress', { cart : { items : [] }, userAddress ,item })
                }
            })

                
        })
        
    }

    exports.shipping = (req, res) => {
        if(req.body.save) {
            User.findOne({ email : req.session.userId })
                .then((user) => {
                    if(user.address) {
                        let updatedUser = user;
                        updatedUser.address.push({ 
                            name : req.body.name, 
                            mobile : req.body.mobile, 
                            address1 : req.body.address1, 
                            address2 : req.body.address2, 
                            city : req.body.city, 
                            state : req.body.state, 
                            zip : req.body.zip 
                        })
                        User.replaceOne({ email : req.session.userId }, updatedUser)
                            .then(() => {
                                res.redirect('/cart/checkout')
                            })
                    }else {
                        let updatedUser = user;
                        updatedUser.address = [{ 
                            name : req.body.name, 
                            mobile : req.body.mobile, 
                            address1 : req.body.address1, 
                            address2 : req.body.address2, 
                            city : req.body.city, 
                            state : req.body.state, 
                            zip : req.body.zip 
                        }]
                        User.replaceOne({ email : req.session.userId }, updatedUser)
                            .then(() => {
                                res.send("updated");
                            })
                    }                    
                })
        }else{
            let anonymousAddress = {
                name : req.body.name, 
                mobile : req.body.mobile, 
                address1 : req.body.address1, 
                address2 : req.body.address2, 
                city : req.body.city, 
                state : req.body.state, 
                zip : req.body.zip 
            }
            req.session.anonymousAddress = anonymousAddress
            res.redirect('/payment')
        }
    }

    exports.paymentPage = (req, res) => {
        Category.find()
        .then((item)=>{
                User.findOne({ email : req.session.userId })
                .then((user) => {
                    if(req.session.anonymousAddress){
                        userAddress = req.session.anonymousAddress
                        Cart.findOne({ owner : req.session.userId })
                            .then((cart) => {
                                if(cart) {
                                    res.render('user/payment', { userAddress, cart,item,validation })
                                    validation.validCoupon = false,
                                    validation.usedCoupon = false,
                                    validation.dateExpiry = false,
                                    validation.amountMin = false
                                   
                                }else{
                                    res.render('user/payment', { userAddress, cart : { items : [] } ,item,validation})
                                   
                                }
                            })
                    }else {
                        userAddress = user.address[+req.query.index]
                        Cart.findOne({ owner : req.session.userId })
                            .then((cart) => {
                                if(cart) {
                                    res.render('user/payment', { userAddress, cart,item ,validation})
                                    validation.validCoupon = false,
                                    validation.usedCoupon = false,
                                    validation.dateExpiry = false,
                                    validation.amountMin = false
                                }else{
                                    res.render('user/payment', { userAddress, cart : { items : [] } ,item ,validation})
                                    validation.validCoupon = false,
                                    validation.usedCoupon = false,
                                    validation.dateExpiry = false,
                                    validation.amountMin = false
                                }
                            })
                    }
                })
        })
       
        
    }


    exports.payment = (req, res) => {       
                let index = +req.body.selectedAddressIndex       
                User.findOne({email : req.session.userId})  
                .then((result)=>{
                        // console.log(result)
                        Cart.updateOne({owner : req.session.userId},{$set :{address :result.address[index]}})
                        .then(()=>{
                                res.redirect(`/payment?index=${req.body.selectedAddressIndex}`)
                        })
                })
        
       
       
    }

//     exports.userPayment =(req,res)=>{
//         let radio =req.body.radios
//         Cart.updateMany({owner : req.session.userId},{$set:{"items.$[elem].orderStatus":"new"}},{arrayFilters : [{"elem.orderStatus" : 'none'}]})
//         .then(()=>{

//         Cart.findOne({owner : req.session.userId})
//         .then((result)=>{
//                 if(radio === "COD"){
//                 let order = new Order({
//                         owner : result.owner,
//                         address : result.address,
//                         items :result.items,
//                         bill : result.bill,
//                         paymentMode : radio,
//                         orderDate : Date(),
                        
//                 })
//                 order.save()
//                 .then(()=>{
                        
                        
//                         res.json({ codSuccess : true})
//                 })
//                }else if(radio==="razorpay"){
//                 let order = new Order({
//                         owner : result.owner,
//                         address : result.address,
//                         items :result.items,
//                         bill : result.bill,
//                         paymentMode : radio,
//                         orderDate : Date(),
                        
//                 })
//                 order.save()
//                 .then(()=>{
                        
//                         res.redirect('/razorpay')
//                         // res.json({ codSuccess : true})
//                 })
//                }else  {
//                 let order = new Order({
//                         owner : result.owner,
//                         address : result.address,
//                         items :result.items,
//                         bill : result.bill,
//                         paymentMode : radio,
//                         orderDate : Date(),
                        
//                 })
//                 order.save()
//                 .then(()=>{
                        
//                         // res.redirect('/razorpay')
//                         res.json({ paypal : true})
//                 })
//                }
//         })
//      })
        
//     }

exports.userPayment = (req,res)=>{
        createOrder = (cart)=> {
                let newOrder = {
                        owner : cart.owner,
                        items : cart.items,
                        address : cart.address,
                        cartBill : cart.bill ,
                        couponCode : coupon.couponCode || '',
                        couponValue : coupon.couponValue || '',
                        orderBill : orderBill || cart.bill ,
                        paymentMethod : paymentMethod,
                        orderDate : new Date()


                }
                req.session.order = newOrder
        }





        const userId = req.session.userId
        const paymentMethod = req.body.radios
        const orderBill = req.body.Bill
        const coupon = req.session.coupon || {}

        orderHelpers.findCart(userId)
        .then((cart)=>{
                if(paymentMethod === "COD"){
                        createOrder(cart)
                        res.json({ codSuccess : true})
                }else if(paymentMethod === "paypal"){
                        createOrder(cart)
                        res.json({paypal : true})
                }else if(paymentMethod === "razorpay"){
                        createOrder(cart)
                        res.redirect('/razorpay')
                }
        }).catch((err)=>console.log(err))       

      }

     
exports.paymentSuccess=(req,res)=>{
        const order = req.session.order
        const coupon = req.session.coupon
        const userId = req.session.userId
        order.items.forEach((items)=>{
                items.orderStatus = "processed"
        })

        orderHelpers.updateStock(order.items)
        .then(()=>{
                return orderHelpers.createOrder(order)
        }).catch((err)=>{
                console.log(err)
        })
        .then(()=>{
                console.log("order created")
                return orderHelpers.couponUpdated(coupon,userId)
        }).catch((err)=>{
                console.log(err)
        })
        .then(()=>{
                console.log('coupon updated')
                return orderHelpers.deleteCart(userId)
        }).catch((err)=>{
                console.log(err)
        })
        .then(()=>{
                res.render('user/payment_success')
        })

}






      

    exports.razorpay = (req, res) => {
        const bill = Cart.findOne({ owner : req.session.userId })
                         .then((cart) => {
                            return cart.bill
             })
        bill.then((totalBill) => {
            console.log(totalBill)
            const razorpay = new Razorpay({
                key_id : `${process.env.RAZORPAY_KEY_ID}`,
                key_secret : `${process.env.RAZORPAY_KEY_SECRET}`
            })
        
            let options = {
                amount: totalBill*100,  // amount in the smallest currency unit
                currency: "INR"
              };
              
              razorpay.orders.create(options, function(err, order) {
                console.log(order);
                res.json({ razorpay : true, order });
              });
        })
    }


    exports.paypal = (req, res) => {
        let billAmount = Order.findOne({ owner : req.session.userId })
        .then((order) => {
           return order.orderBill;
        })
        billAmount.then((bill) => {
           bill = Math.round(+bill*0.01368)
        //    console.log(bill);
        
        Paypal.configure({
        'mode': 'sandbox', //sandbox or live 
        'client_id': 'Adhmp6JYV1LMWMvOzzeYdwkzdz24RHWLq6u-PRa92veDdHBbwPc2Lt5b2rgfqz1P3eyw36XD6hbT5D4j', 
        // please provide your client id here 
        'client_secret': 'EGMWJAMH7nUuiKLaFSi-RAkrTR7mRcsWqbQOAKlmDX_C2lEt6dMWpqIq8fqOpknZ_kAfb5WL1mqS8Cza' // provide your client secret here 
        });
    
        // create payment object 
        let payment = {
        "intent": "authorize",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": 'http://localhost:5050/paymentSuccess',
            "cancel_url": "http://127.0.0.1:3000/err"
        },
        "transactions": [{
            "amount": {
                "total": `${+bill}`,
                "currency": "USD"
            },
            "description": " a book on mean stack "
        }]
        }
    
        let createPay = ( payment ) => {
        return new Promise( ( resolve , reject ) => {
            Paypal.payment.create( payment , function( err , payment ) {
                if ( err ) {
                    reject(err); 
                }
            else {
                resolve(payment); 
            }
            }); 
        });
        }	
    
        // call the create Pay method 
        createPay( payment ) 
        .then( ( transaction ) => {
        // console.log(transaction)
        var id = transaction.id; 
        var links = transaction.links;
        var counter = links.length; 
        while( counter -- ) {
            if ( links[counter].method == 'REDIRECT') {
                // console.log(transaction);
                // redirect to paypal where user approves the transaction 
                return res.redirect( links[counter].href )
            }
        }
        })
        .catch( ( err ) => { 
        console.log( err ); 
        res.redirect('/err');
        });
    
    
        })
    }


//     exports.test = (req, res) => {

//         const razorpay = new Razorpay({
//             key_id : `${process.env.RAZORPAY_KEY_ID}`,
//             key_secret : `${process.env.RAZORPAY_KEY_SECRET}`
//         })
    
//         let options = {
//             amount: 50000,  
//             currency: "INR"
//           };
          
//           razorpay.orders.create(options, function(err, order) {
//         //     console.log(order);
//             res.json(order);
//           });
//     }
exports.test = (req, res) => {

        const months = [
            january = [],
            february = [],
            march = [],
            april = [],
            may = [],
            june = [],
            july = [],
            august = [],
            september = [],
            october = [],
            november = [],
            december = []
        ]
        
        const quarters = [
            Q1 = [],
            Q2 = [],
            Q3 = [],
            Q4 = []
        ]
    
        const monthNum = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ]
    
        Order.find({ "items.orderStatus" : "Delivered" })
            .then((orders) => {
                monthNum.forEach((month, monthIndex) => {
                    orders.forEach((order, index) => {
                        if(order.orderDate.getMonth()+1 == monthIndex+1 ) {
                            months[monthIndex].push(order);
                        }
                    })
                })//author: Jafin
     
                orders.forEach((order) => {
                    if(order.orderDate.getMonth()+1 <= 3){
                        quarters[0].push(order)
                    }else if(order.orderDate.getMonth()+1 > 3 && order.orderDate.getMonth()+1 <= 6){
                        quarters[1].push(order)
                    }else if(order.orderDate.getMonth()+1 > 6 && order.orderDate.getMonth()+1 <= 9){
                        quarters[2].push(order)
                    }else if(order.orderDate.getMonth()+1 >9 && order.orderDate.getMonth()+1 <= 12){
                        quarters[3].push(order)
                    }
                })
                
                const monthlySalesTurnover = [];
                const quarterlySalesTurnover = [];
                months.forEach((month) => {
                    let eachMonthTurnover = month.reduce((acc, curr) => {
                        acc += +curr.orderBill;
                        return acc;
                    }, 0)
                    monthlySalesTurnover.push(eachMonthTurnover);
                })
    
                quarters.forEach((quarter) => {
                    let eachQuarterTurnover = quarter.reduce((acc, curr) => {
                        acc += curr.orderBill;
                        return acc;
                    }, 0)
                    quarterlySalesTurnover.push(eachQuarterTurnover)
                })
    
                let annualSales = orders.reduce((acc, curr) => {
                    acc += curr.orderBill
                    return acc;
                }, 0)
    
                res.json({ salesOfTheYear : monthlySalesTurnover, quarterlySales : quarterlySalesTurnover, annualSales : annualSales })
            })
    }
    





exports.signUp =(req,res)=>{
        if(req.body.password===req.body.confirmPassword){
             
                let userEmail=req.body.email
                User.findOne({email:userEmail})
                   .then((result)=>{
                   if(result){
                        res.redirect('/user_registration?account=true')
                   }
                   else{
                const userData = new User(req.body)
                userData.blockStatus=false              
                userData.save() 
                        .then(()=>{
                                res.redirect('/user_signin')
                        })
                        .catch((err)=>{
                                console.log(err)
                                // res.redirect('/user_registration')
                        }) 
                }                                                     
        })
} else{
                res.redirect('/user_registration?pass=false')    
        }
}


exports.otpVerification=(req,res)=>{
        res.render('user/mobile-verification')
}
exports.verifyOtpPage=(req,res)=>{
        if(req.session.otplogin){
            res.redirect('/user_home') 
        }else
        
        res.render('user/otp-verify')
}
exports.verifyOtp=(req,res)=>{
        let otpObject=req.body
        otp.veriOtp(otpObject.otp,req.session.mobileNumber)
        .then((verify)=>{
                if(verify){
                        User.findOne({mobile : req.session.mobileNumber})
                        .then((user)=>{
                                req.session.userId = user.email
                                req.session.otplogin = true
                                res.redirect('/user_home')
                        })
                }else
                res.redirect('/verifyOtp?otp=false')

        })
        .catch((err)=>{
                console.log(err)
        })

}
exports.sendOtp=(req,res)=>{
        User.findOne({phone:req.body.mobile})
        .then((user)=>{
                if(user){
                        req.session.mobileNumber=req.body.mobile
                        otp.sendOtp(req.body.mobile)
                        res.redirect('/verifyOtp')
                }else{
                        res.send('Not valid')
                }
        })
}




exports.login=(req,res)=>{
     const loginData=req.body
     User.findOne({email : loginData.email, password: loginData.password,blockStatus:false})
        .then((result)=>{
                if(result){
                        session=req.session
                        session.userId = loginData.email
                        //console.log(session)
                        res.redirect('user_home')
                }else{
                        User.findOne({email:loginData.email})
                        .then((result)=>{
                                if(result){
                                        if(result.blockStatus){
                                        res.redirect('/user_signin?blockstatus=true')
                                }
                                else
                                        res.redirect('/user_signin?pass=false')
                                }else{
                                       res.redirect('/user_signin?register=false')
                                }
                        })
                }
        })
        .catch((err)=>console.log(err))
}
exports.adminLogin=(req,res)=>{
        const loginData=req.body
        Admin.findOne({name : loginData.name, password: loginData.password})
           .then((result)=>{
                   if(result){
                           session=req.session
                           session.adminId = loginData.name
                           //console.log(session)
                           res.redirect('/admin_panel')
                   }else{
                           Admin.findOne({name:loginData.name})
                           .then((result)=>{
                                   if(result){
                                           res.redirect('/admin_signin?pass=false')
                                   }else{
                                           res.redirect('/admin_signin?register=false')
                                   }
                           })
                   }
           })
           .catch((err)=>console.log(err))
   }
   exports.adminPanel=(req,res)=>{
        res.render('admin/dashboard')
}
exports.adminUsers=(req,res)=>{
        User.find((err,users)=>{
                if(!err){
                        res.render('admin/users',{users})
                }
        })       
}
exports.userBlock=(req,res)=>{
        let blockId =req.query.id
        User.updateOne({_id : ObjectId(blockId)},{$set :{blockStatus :true}})
        .then(()=>{
                req.session.userId=""
                res.redirect('/admin_users')
        })
        .catch((err)=>{
                console.log(err)
        })
}
exports.userUnBlock=(req,res)=>{
        let blockId =req.query.id
        User.updateOne({_id : ObjectId(blockId)},{$set :{blockStatus :false}})
        .then(()=>{
                res.redirect('/admin_users')
        })
        .catch((err)=>{
                console.log(err)
        })
}

exports.adminProducts=(req,res)=>{
        Product.find()
        .then((result)=>{
                res.render('admin/products',{result})
        })
       
}
exports.addProducts=(req,res)=>{
        

        Category.find()
        .then((item)=>{
                
                res.render('admin/add-Products',{result:'', item})
        })
        
                
        
        
}

exports.addProduct=(req,res,next)=>{
        const files =req.files;

        if(!files){
                const error=new Error ('please choose file')
                error.httpStatusCode =400
                return next(error)
        }

        let productDetail=new Product({
            productName : req.body.productName,
            actualPrice: req.body.actualPrice,
            discountedPrice: req.body.discountedPrice,
            description : req.body.description,
            stock : req.body.stock,
            category : req.body.category,
        //     subCategory : req.body.subCategory,
            image1 : req.files[0] && req.files[0].filename ? req.files[0].filename:"",
            image2 : req.files[1] && req.files[1].filename ? req.files[1].filename:""

        })

        productDetail.save()
        .then(()=>{
                res.redirect('/admin_panel/add-products')
        })
        .catch(error=>{
                console.log(error)
        })
}
exports.updateProduct=(req,res)=>{
        let updateId=req.query.id

        Product.updateOne({_id:ObjectId(updateId)},{$set:{
            productName : req.body.productName,
            actualPrice: req.body.actualPrice,
            discountedPrice: req.body.discountedPrice,
            description : req.body.description,
            stock : req.body.stock,
            category : req.body.category,
            subCategory : req.body.subCategory,
            image1 : req.files[0] && req.files[0].filename ? req.files[0].filename:"",
            image2 : req.files[1] && req.files[1].filename ? req.files[1].filename:""

        }})
        .then(()=>{
                res.redirect('/admin_products')
        })
        .catch((err)=>{
                console.log(err)
        })
}
exports.editProduct=(req,res)=>{
        let editId=req.query.id        
        Category.find()
        .then((item)=>{
                
                Product.findOne({_id:ObjectId(editId)})
                .then((result)=>{
                if(result){
                        res.render('admin/add-Products',{result,item})
                }
        })
        })
        
}
exports.deleteProduct=(req,res)=>{
        let deleteId=req.query.id
        Product.deleteOne({_id:ObjectId(deleteId)})
        .then(()=>{
                res.redirect('/admin_products')
        })
}



exports.adminOrder=(req,res)=>{
        Order.find()
        .then((result)=>{
                res.render('admin/orders',{result})
        })
        
}
exports.viewOrder=(req,res)=>{
        let orderId=req.query.id
        Order.findOne({_id:ObjectId(orderId)})
        .then((result)=>{
                res.render('admin/viewOrder',{result})
        })
        
}

exports.orderAccept=(req,res)=>{
        let itemId=req.query.id;
        let orderId=req.query.orderId;
        console.log(itemId)
        console.log(orderId)

        Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Processed'}})
            .then(()=>{
                res.redirect(`/admin-orders/viewOrder?id=${orderId}`)
            })
            .catch((err)=>console.log(err))
    }

    exports.orderProcessed=(req,res)=>{
        let itemId=req.query.id;
        let orderId=req.query.orderId;
    
        Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Shipped'}})
            .then(()=>{
                res.redirect(`/admin-orders/viewOrder?id=${orderId}`)
            })
            .catch((err)=>console.log(err))
    }

    exports.orderShipped=(req,res)=>{
        let itemId=req.query.id;
        let orderId=req.query.orderId;
    
        Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Delivered'}})
            .then(()=>{
                res.redirect(`/admin-orders/viewOrder?id=${orderId}`)
            })
            .catch((err)=>console.log(err))
    }

    exports.orderCancel=(req,res)=>{
        let itemId=req.query.id;
        let orderId=req.query.orderId;
    
        Order.updateOne({_id:ObjectId(orderId),"items.itemId":itemId},{$set:{'items.$.orderStatus':'Cancel'}})
            .then(()=>{
                res.redirect(`/admin-orders/viewOrder?id=${orderId}`)
            })
            .catch((err)=>console.log(err))
    }

exports.adminCategory=(req,res)=>{    
        Category.find()
        .then((result)=>{
                
                res.render('admin/category',{result,validation}) 
                validation.category = false
        })   
        .catch((err)=>console.log(err))
}

exports.addCategory=(req,res)=>{
       
        Category.findOne( { category : req.body.category})
        .then((result)=>{
                
                if(result){
                        validation.category = true
                    res.redirect('/admin-category') 
                       
                        
                }else{
                        let category = new Category({
                            category : req.body.category                               
                        })
                        
                        category.save()
                        .then(()=>{
                                res.redirect('/admin-category') 
                        })
                        .catch((err)=>console.log(err))
                }
        })
       
}


exports.deleteCategory=(req,res)=>{
        console.log('haii')
        Category.deleteOne({category : req.query.id})
        .then(()=>{
                res.redirect('/admin-category')
        })
}

exports.adminCoupon=(req,res)=>{
        Coupon.find()
        .then((coupon)=>{

                Coupon.updateMany({couponExpiry:{$lte : Date.now()}},{$set :{status : "Expired"}})
                .then(()=>{
                        res.render('admin/coupon',{coupon,validation})
                        validation.existingCoupon=false
                })             
        })
        
}

exports.addCoupon=(req,res)=>{
        Coupon.findOne({couponCode : req.body.coupencode})
        .then((result)=>{
                
                if(result){
                        validation.existingCoupon = true
                        res.redirect('/admin-coupon')
                }else{
                        let coupon = new Coupon({
                                couponCode : req.body.coupencode,
                                couponValue : req.body.coupenvalue,
                                minBill : req.body.minbill,
                                couponExpiry:req.body.expirydate,
                                status : 'Active'
                                
                        })
                        coupon.save()
                        .then(()=>{
                                res.redirect('/admin-coupon')
                        })
                }               
        })      
}

exports.deleteCoupon=(req,res)=>{
        Coupon.deleteOne({coupen : req.query.id})
        .then(()=>{
                res.redirect('/admin-coupon')
        })

}


exports.exportExcel=(req,res)=>{
        Order.find()
        .then((SalesReport)=>{
          
      
       console.log(SalesReport)
        try {
          const workbook = new excelJs.Workbook();
      
          const worksheet = workbook.addWorksheet("Sales Report");
      
          worksheet.columns = [
            { header: "S no.", key: "s_no" },
            { header: "OrderID", key: "_id" },
            { header: "Date", key: "orderDate" },
            { header: "Products", key: "productName" },
            { header: "Method", key: "paymentMethod" },
        //     { header: "status", key: "status" },
            { header: "Amount", key: "orderBill" },
          ];
          let counter = 1;
          SalesReport.forEach((report) => {
            report.s_no = counter;
            report.productName = "";
            // report.name = report.userid;
            report.items.forEach((eachproduct) => {
              report.productName += eachproduct.productName + ", ";
            });
            worksheet.addRow(report);
            counter++;
          });
      
          worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
          });
          
      
          res.header(
            "Content-Type",
            "application/vnd.oppenxmlformats-officedocument.spreadsheatml.sheet"
          );
          res.header("Content-Disposition", "attachment; filename=report.xlsx");
      
          workbook.xlsx.write(res);
        } catch (err) {
          console.log(err.message);
        }
      });

}




exports.adminLogout = (req, res) => {
        req.session.adminId=""
        res.redirect('/admin_signin')
    }
exports.logout = (req, res) => {
        req.session.userId=""
        req.session.otplogin=""
        req.session.mobileNumber=""
        req,session.anonymousAddress=""
        res.redirect('/user_signin')
    }
