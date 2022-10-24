
const Cart = require('../model/cartModel');
const Product = require('../model/productsModel')
const Order = require('../model/orderModel')
const Coupon = require('../model/couponModel')
// const Cart =require ('../model/cartModel');




module.exports ={
        findCart : function(userId){
            return new Promise((resolve,reject)=>{
                Cart.findOne({owner : userId})
                    .then((cart)=>{
                        resolve(cart)
                    })
            })
        },
    updateStock : function(items){
        return new Promise((resolve,reject)=>{
            items.forEach(item =>{
                let itemQuantity = +item.quantity
                Product.updateOne({ _id : item.itemId }, {$inc : {stock : -itemQuantity }})
                    .then(()=>{
                        return
                    }).catch((err)=>console.log(err))
            })
            resolve()
            reject(err)
        })

    },
    createOrder : function (order){
                return new Promise((resolve,reject)=>{
                    let newOrder = new Order (order)
                    newOrder.save()
                    .then(()=>{
                        resolve()
                    }).catch((err)=>{
                        reject(err)
                    })
                })
    } ,
    couponUpdated : function (coupon,userId){
           return new Promise((resolve,reject)=>{
            Coupon.updateOne({couponCode : coupon.couponCode || ''},{$push :{users : userId}})
            .then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
           })          
    } ,

    deleteCart : function (userId){
        return new Promise((resolve,reject)=>{
            Cart.deleteOne({owner : userId})
            .then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    } 
}


