const {Order} = require('../models/order');
const express = require('express');
const {OrderItem} = require("../models/order-item");
const router = express.Router();

router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});

    if (!orderList){
        res.status(500).json({success: false});
    }
    res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate:
                {path: 'product', populate: 'category'}})

    if (!order){
        res.status(500).json({success: false});
    }
    res.send(order);
});

router.post(`/`, async (req, res) => {

    const orderItemsIDs = Promise.all(req.body.orderItems.map(async orderitem => {
        let newOrderItem = new OrderItem({
            quantity: orderitem.quantity,
            product: orderitem.product,
        })
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))

    const orderItemsIDsResolved = await orderItemsIDs;

    const totalPrices = Promise.all(orderItemsIDsResolved.map(async orderItemID => {
        const orderItem = await OrderItem.findById(orderItemID).populate('product', 'price');
        return orderItem.product.price * orderItem.quantity;
    }))

    const totalPrice = (await (totalPrices)).reduce((a, b) => a + b, 0)

    let order = new Order({
        orderItems: orderItemsIDsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: req.body.totalPrice,
        user: req.body.user,
    });
    order = await order.save();

    if (!order){
        return res.status(404).send('The order cannot be created!');
    }
    res.send(order);
});

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        },
        {new: true}
    )

    if (!order){
        return res.status(400).send('The order cannot be created!');
    }
    res.send(order);
});

router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order){
            order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem);
            });
            return res.status(200).json({success: true, message: 'The order is deleted!'});
        }else {
            return res.status(404).json({success: false, message: 'Order was not found!'});
        }
    }).catch(err => {
        return res.status(400).json({success: false, error: err});
    })
});

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        {$group: {_id: null, totalsales: {$sum: '$totalPrice'}}}
    ])

    if (!totalSales){
        return res.status(400).send('The order cannot be generated');
    }
    res.send({totalsales: totalSales.pop().totalsales});
})

router.get('/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count);


    if (!orderCount){
        return res.status(500).json({success: false});
    }
    res.send({
        orderCount: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid}).populate({
        path: 'orderItems', populate: {
            path : 'product', populate: 'category'}
    }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false})
    }
    res.send(userOrderList);
})

module.exports = router;