var express = require('express');
var jwt = require('jsonwebtoken')
var router = express.Router();
const md5 = require('blueimp-md5')
const UserModel = require('../models/UserModel')
const _filter = {'pwd': 0, '__v': 0} // 查询时过滤掉
const sms_util = require('../util/sms_util')
const users = {}
const ajax = require('../api/ajax')
var svgCaptcha = require('svg-captcha')
const createToken = require('../token/createToken')
const checkToken = require('../token/checkToken')

const test = require('./test')
test(router)

/*
密码登陆
 */
router.post('/login_pwd', function (req, res) {
  const name = req.body.name
  const pwd = md5(req.body.pwd)
  // const captcha = req.body.captcha.toLowerCase()
  // console.log('/login_pwd', name, pwd, captcha)

  // 可以对用户名/密码格式进行检查, 如果非法, 返回提示信息
  // if (captcha !== req.session.captcha) {
  //   return res.send({code: 1, msg: '验证码不正确'})
  // }
  // 删除保存的验证码
  // delete req.session.captcha

  UserModel.findOne({name})
    .then((user) => {
      if (user) {
        if (user.pwd !== pwd) {
          res.send({code: 1, msg: '用户名或密码不正确!'})
        } else {
          res.send({
            code: 0, 
            data: {
              _id: user._id, 
              name: user.name, 
              phone: user.phone,
              token: createToken(user._id)
            }
          })
        }
        return new Promise(() => {

        }) // 返回一个pending状态的promise对象
      } else {
        return UserModel.create({name, pwd})
      }
    })
    .then((user) => {
      const data = {
        _id: user._id,
        name: user.name,
        token: createToken(user._id)
      }
      // 3.2. 返回数据(新的user)
      res.send({code: 0, data})
    })
    .catch(error => {
      console.error('/login_pwd', error)
    })
})


/*
发送验证码短信
*/
router.get('/sendcode', function (req, res, next) {
  //1. 获取请求参数数据
  var phone = req.query.phone;
  //2. 处理数据
  //生成验证码(6位随机数)
  var code = sms_util.randomCode(6);
  //发送给指定的手机号
  console.log(`向${phone}发送验证码短信: ${code}`);
  sms_util.sendCode(phone, code, function (success) {//success表示是否成功
    if (success) {
      users[phone] = code
      console.log('保存验证码: ', phone, code)
      res.send({"code": 0})
    } else {
      //3. 返回响应数据
      res.send({"code": 1, msg: '短信验证码发送失败'})
    }
  })
})

/*
短信登陆
*/
router.post('/login_sms', function (req, res, next) {
  var phone = req.body.phone;
  var code = req.body.code;
  if (users[phone] != code) {
    res.send({code: 1, msg: '手机号或验证码不正确'});
    return;
  }
  //删除保存的code
  delete users[phone];


  UserModel.findOne({phone})
    .then(user => {
      if (user) {
        user._doc.token = createToken(user._id)
        res.send({code: 0, data: user})
      } else {
        //存储数据
        return new UserModel({phone}).save()
      }
    })
    .then(user => {
      user._doc.token = createToken(user._id)
      res.send({code: 0, data: user})
    })
    .catch(error => {
      console.error('/login_sms', error)
    })

})

/*
根据请求携带的token查询对应的user
 */
router.get('/auto_login', function(req, res) {
  // 得到请求头中的token
  const token = req.headers['authorization']
  
  // 如果请求头中没有token, 直接返回
  if (!token) {
    return res.send({code: 1, msg: '请先登陆'})
  }
  
  // 解码token, 如果失败或过了有效期, 返回401
  const decoded = jwt.decode(token, 'secret')
  if (!decoded || decoded.exp < Date.now() / 1000) {
    res.status(401)
    return res.json({ message: 'token过期，请重新登录' })
  }

  // 根据解码出的用户id, 查询得到对应的user, 返回给客户端
  const userId = decoded.id
  UserModel.findOne({ _id: userId }, _filter)
    .then(user => {
      res.send({code: 0, data: user})
    })
})

//唯品会首页导航国际路由中的 商品
router.get('/getguoji', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/nav_guoji.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会首页导航母婴路由中的 商品
router.get('/getmuying', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/nav_muYing.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会主页女装下面的所有小图片
router.get('/getHomepng', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/home_nv_item.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会分类导航男装路由中的 商品
router.get('/getcategoryman', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/category_man.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会分类导航女装路由中的 商品
router.get('/getcategorywoman', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/category_woman.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会分类导航男装路由中的 导航
router.get('/getcateman', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/cate_man_nav.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会主页下面的女装里面第2个导航
router.get('/getHomeNvList', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/home_nv_listBar.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会分类导航女装路由中的导航
router.get('/getcatewoman', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/cate_woman_nav.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会商城图标路由中的左侧导航
router.get('/getshopleftNav', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_leftNav.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会商城图标路由中的左侧男女内衣菜单
router.get('/getshopUnderwear', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_underwear.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会商城图标路由中的左侧男装菜单
router.get('/getshopman', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_man.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会商城图标路由中的左侧女装菜单
router.get('/getshopwoman', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_woman.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会商城图标路由中的左侧菜单精选推荐路由第一个羽绒服商品菜单
router.get('/getshopYuRong', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_first_yurong.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会商城图标路由中的左侧菜单精选推荐路由女靴商品菜单
router.get('/getshopbottine', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_bottine.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会商城图标路由中的左侧菜单精选推荐路由第一个羽绒服商品菜单第一个商品的详情页
router.get('/getshopYuRongFirst', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/shop_yurong_first.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会首页下面的大图标商品总计
router.get('/gethomebottomList', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/home_bottomList.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会首页下面的图标里面单个商品
router.get('/gethomeBottomItemr', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/home.json')
    res.send({code: 0, data})
  }, 300)
})


//唯品会商城的热销榜皮裤
router.get('/gethotsellpiku', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/hotsell_piku.json')
    res.send({code: 0, data})
  }, 300)
})
//唯品会商城的热销榜连衣裙
router.get('/getshopSkirt', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/hotsell_lianyiqun.json')
    res.send({code: 0, data})
  }, 300)
})

//唯品会商城的半截裙
router.get('/getshopSkirtHalf', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/hotsell_banjiequn.json')
    res.send({code: 0, data})
  }, 300)
})


//坤
//省市县三级联动
router.get('/getcityCode', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/city_code.json')
    res.send({code: 0, data})
  }, 300)
})
// 搜索栏爆款列表
router.get('/getsearchShopList', function(req, res) {
  setTimeout(function () {
    const data = require('../datas/search_shop_list.json')
    res.send({code: 0, data})
  }, 300)
})



/* 
router.get('/search_shops', checkToken, function(req, res) {
  const {geohash, keyword} = req.query
  ajax('http://cangdu.org:8001/v4/restaurants', {
    'extras[]': 'restaurant_activity',
    geohash,
    keyword,
    type: 'search'
  }).then(data => {
    res.send({code: 0, data})
  })
}) 
*/

module.exports = router;