import request from './request.js'
import requestQuality from './request-quality.js'

export function loginQuality(username, password) { //登录质控服务
  return requestQuality({
    url: '/user/login',
    method: 'get',
    params: { username, password },
    timeout: 3000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function login(username, password) { //登录
  return request({
    url: '/user/login',
    method: 'get',
    params: { username, password },
    timeout: 3000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
  
//暂未接上：
export function register(data) { //注册
  return request({
    url: '/user/register',
    method: 'post',
    data: data,
  })
}
  
export function getUserInfo() { //获取当前用户信息
  return request({
    url: '/user/getUserInfo',
    method: 'get',
  })
}

export function updateUserInfo(data) { //修改用户信息
  return request({
    url: '/user/updateUserInfo',
    method: 'post',
    data:data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getUsersInfo() { //获取多个用户信息
  return request({
    url: '/user/getUsersInfo',
    method: 'get',
  })
}

export function getAllUsersInfo() { //获取所有用户信息
  return request({
    url: '/user/getAllUsersInfo',
    method: 'get',
  })
}

export function insertUser(data) { //新增用户
  return request({
    url: '/user/insertUser',
    method: 'post',
    data:data
  })
}

export function deleteUser(userId) { //删除用户
  return request({
    url: '/user/deleteUser',
    method: 'post',
    params: {userId}
  })
}

//关于签名
export function getElecNamePathAndDepartmentAndHospital(){
  return request({
    url: '/user/getElecNamePathAndDepartmentAndHospital',
    method: 'get',
  })
}

export function checkDefaultPassword(){
  return request({
    url:'/user/checkIsDefaultPassword',
    method:'get'
  })
}

// changePassword
export function changePassword(data){
  return request({
    url:'/user/updatePassword',
    method:'post',
    params: data
  })
}

// resetPassword
export function resetPassword(userId){
  return request({
    url:'/user/resetPassword',
    method:'get',
    params: {userId}
  })
}
