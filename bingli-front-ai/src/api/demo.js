import request from '../utils/request.js'

export default{
  demo(data){
    return request.post("api",data)
  }
}