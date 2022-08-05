import axios, {AxiosResponse} from 'axios';


export class BackendApi {

  private backendUrl: string;
  private auth: any;

  constructor(url: string, auth: any) {
    this.backendUrl = url;
    this.auth = auth
  }

  saveTabset(data: any) {
    console.log("posting to backend @ url", this.backendUrl)
    return axios.post(`${this.backendUrl}/saveTabset`, data, {})
  }
}


function initializeBackendApi(url: string, auth: any): BackendApi {
  return new BackendApi(url, auth)
}

export {
  initializeBackendApi
}

