const mongoose = require ('mongoose')
const {ObjectID} =require('bson')
const Schema = mongoose.Schema


const wishlistSchema =new Schema({
    owner:{
        type : String ,
        required : true
    },
    items :[{
        itemId: {
            type : ObjectID,
            required: true
        },
        productName:{
            type: String,
        },
        price:{
            type: Number
        },
        category:{
            type:String,
            required:true
        },
        image1:{
            type:String,
            required:true
        },       
    }]
},{timestamps:true})

const Wishlist=mongoose.model('Wishlist',wishlistSchema)
module.exports =Wishlist