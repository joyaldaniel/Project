const express = require('express');
const services = require('../controller/render')
const store=require('../middleware/multer')

const router = express.Router();


router.get('/admin_panel', services.adminLoggedIn, services.adminPanel)
router.get('/admin_logout', services.adminLogout)


router.get('/admin_signin',services.adminLoggedOut, services.adminLoginRouter)
router.post('/admin_signin',services.adminLogin)



router.get('/admin_users',services.adminLoggedIn,services.adminUsers)
router.get('/admin_logout', services.adminLogout)

router.post('/admin_panel/users/block',services.userBlock)
router.post('/admin_panel/users/unblock',services.userUnBlock)


router.get('/admin_products',services.adminLoggedIn,services.adminProducts)
router.get('/admin_panel/add-products',services.adminLoggedIn,services.addProducts)
router.post('/admin_panel/add-product',store.any(),services.addProduct)
router.post('/admin_panel/add-product/update',store.any(),services.updateProduct)
router.get('/admin_panel/edit-product',services.editProduct)
router.get('/admin_panel/delete-product',services.deleteProduct)


router.get('/admin-orders',services.adminOrder)
router.get('/admin-orders/viewOrder',services.viewOrder)
router.post('/admin-orders/order-accept',services.orderAccept)
router.post('/admin-orders/order-processed',services.orderProcessed)
router.post('/admin-orders/order-shipped',services.orderShipped)
router.post('/admin-orders/order-cancel',services.orderCancel)

router.get('/admin-category',services.adminCategory)
router.post('/admin-category',services.addCategory)
router.get('/admin-category/delete',services.deleteCategory)


router.get('/admin-coupon',services.adminCoupon)
router.post('/admin-coupon/add-coupon',services.addCoupon)
router.post('/admin-coupon/delete-coupon',services.deleteCoupon)

router.get('/admin/exportExcel',services.exportExcel)

router.post('/test',services.test)





module.exports = router;


