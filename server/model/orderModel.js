const mongoose = require('mongoose');
const { ObjectID } = require('bson');


const orderSchema = new mongoose.Schema({
    owner : {
      type: String,
       required: true
    },
    address : {
        name : { type : String },
        mobile : { type : Number },
        address1 : { type : String},
        address2 : { type : String},
        city : { type : String },
        state : { type : String },
        zip : { type : Number } 

    },
    items: [{
        itemId: {
            type: ObjectID,
            required: true
        },
        productName: {
            type : String
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: {
            type : Number
        },
        category : {
            type : String,
            required : true
        },
        image1 : {
            type : String, 
            required : true
        },
        orderStatus : {
            type : String,
            default : "None"
        }
    }],
    cartBill: {
        type: Number,
        required: true,
        default: 0
    },
    orderBill:{
        type: Number,
        required: true,
        default: 0

    },
    paymentMethode: {
        type : String
    },
    orderDate : {
        type : Date,
        default: Date()
    },
    couponCode:{
        type:String
    },
    couponValue:{
        type:String
    }

}, {timestamps: true})


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;


















