import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

/** 请求配置 */
const requestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
} as const;

/** 响应数据结构 */
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/** 创建 axios 实例 */
const instance: AxiosInstance = axios.create({
  baseURL: requestConfig.baseURL,
  timeout: requestConfig.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

/** 请求拦截器 */
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/** 响应拦截器 */
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, data, message } = response.data;

    if (code === 200 || code === 0) {
      return data;
    }

    console.error("API Error:", message);
    return Promise.reject(new Error(message || "请求失败"));
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    if (!error.response) {
      console.error("网络错误");
      return Promise.reject(error);
    }

    const { status } = error.response;
    const shouldRetry = status >= 500 || status === 429;

    if (shouldRetry && config) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < requestConfig.maxRetries) {
        config._retryCount++;
        await new Promise((resolve) => setTimeout(resolve, requestConfig.retryDelay));
        return instance(config);
      }
    }

    return Promise.reject(error);
  }
);

/** 请求方法封装 */
export const request = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, { params, ...config });
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config);
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config);
  },

  upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progressEvent: any) => void
  ): Promise<T> {
    return instance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    });
  },
};

export default request;
