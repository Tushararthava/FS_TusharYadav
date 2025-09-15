import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;

  private constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('anonymousUsername');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Auth endpoints
  public async login(email: string, password: string) {
    const response = await this.api.post('/users/login', { email, password });
    return response.data;
  }

  public async register(userData: {
    email: string;
    password: string;
    homeLocation: [number, number];
    destination: [number, number];
    schedule: {
      departureTime: string;
      returnTime: string;
      daysOfWeek: string[];
    };
  }) {
    const response = await this.api.post('/users/register', userData);
    return response.data;
  }

  // Route endpoints
  public async getNearbyUsers() {
    const response = await this.api.get('/routes/nearby');
    return response.data;
  }

  public async updateRoute(routeData: {
    homeLocation: [number, number];
    destination: [number, number];
    schedule: {
      departureTime: string;
      returnTime: string;
      daysOfWeek: string[];
    };
  }) {
    const response = await this.api.put('/routes/update-route', routeData);
    return response.data;
  }

  // Chat endpoints
  public async startChat(otherUserId: string) {
    const response = await this.api.post('/chat/start', { otherUserId });
    return response.data;
  }

  public async getChats() {
    const response = await this.api.get('/chat/my-chats');
    return response.data;
  }

  public async getChatMessages(chatId: string) {
    const response = await this.api.get(`/chat/${chatId}`);
    return response.data;
  }

  public async sendMessage(chatId: string, content: string) {
    const response = await this.api.post(`/chat/${chatId}/message`, { content });
    return response.data;
  }
}

export default ApiService.getInstance();