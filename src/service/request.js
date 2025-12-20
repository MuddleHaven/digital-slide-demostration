import axios from "axios";
import { message } from 'ant-design-vue';
import { useRouter } from "vue-router";
import { clearLocalStorage } from "@/utils/index.js";

// request config
const RequestConfig = {
  BASE_URL_SERVER: import.meta.env.VITE_BASE_URL,
  // 设置超时时间为1min
  TIMEOUT: 60 * 1000,
};

let baseURL = RequestConfig.BASE_URL_SERVER;

// 动态加载配置文件
const loadConfig = async () => {
  try {
    const response = await fetch('/config.json');
    const data = await response.json();
    baseURL = data.backendUrl;
  } catch (error) {
    message.error('Failed to load config: ' + error.message);
  }
};

// 确保配置加载完成
const ensureConfigLoaded = async () => {
  // debug 模式下不加载配置文件
  if (import.meta.env.DEV) {
    return;
  }
  if (!baseURL || baseURL === RequestConfig.BASE_URL_LOCAL) {
    await loadConfig();
  }
};

const service = axios.create({
  // 设置超时时间为20min
  timeout: 20 * 60 * 1000, 
  baseURL: baseURL
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// 请求拦截器
service.interceptors.request.use(async (config) => {
  await ensureConfigLoaded(); // 确保配置加载完成

  const token = localStorage.getItem('token'); // 获取token
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  if (baseURL) {
    config.baseURL = `${baseURL}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

//响应拦截器
service.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      const res = response.data;
      if (res.code !== 200) {
        if (res.code === 401) {
          // 删除token并重定向到登录页面
          message.error("请重新登录");
          const router = useRouter();
          localStorage.clear();
          router.push('/login');
        } else if (res.code == 999) {
          // message.error(res.msg);
          // localStorage.clear();
          // router.push('/login');
        } else {
          // message.error(res.msg);
          debounce(message.error(res.msg), 1000);
        }
        return Promise.reject(res.msg);
      }
      return res;
    } else {
      // 200 以外的状态码
      return Promise.reject(response.error);
    }
  },
  error => {
    console.log("response error:", error);
    
    // 处理错误响应
    if (error.response && error.response.status === 401) {
      message.error("请重新登录");
      // 删除token 重定向到登录页面
      const router = useRouter();
      clearLocalStorage();
      router.push('/login');
    } else {
      debounce(message.error("连接失败"), 3000);
      // message.error("连接失败");
    }
    return Promise.reject(error);
  }
);

// 防抖函数 error 提示3秒内只提示一次
function debounce(fn, delay) {
  let timer = null;
  return function () {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments);
    }, delay);
  };
}

export default service;