import axios, {AxiosResponse} from 'axios';
import {useAuthStore} from "src/stores/auth";

export class BackendApi {

  private backendUrl: string = ''
  private auth: any;

  init(url: string, auth: any) {
    this.backendUrl = url;
    this.auth = auth
  }

  saveTabset(data: any):Promise<AxiosResponse<string>> {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      return Promise.reject("user not authenticated")
    }
    return auth.getToken
      .then(token => {
        console.log("posting to backend @ url", this.backendUrl)
        return axios.post(`${this.backendUrl}/tabsets`, data, {headers: {'AuthToken': token}})
      })
      //.catch(err => console.log("err", err))
  }

  deleteTabset(tsId: string):Promise<AxiosResponse<string>> {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      return Promise.reject("user not authenticated")
    }
    return auth.getToken
      .then(token => {
        console.log("deleting backend @ url", this.backendUrl, token)
        return axios.delete(`${this.backendUrl}/tabsets/${tsId}`, {headers: {'AuthToken': token}})
      })
    //.catch(err => console.log("err", err))
  }

  getTabsets() {
    const auth = useAuthStore()
    return auth.getToken
      .then(token => {
        console.log("getting backend @ url", this.backendUrl)
        return axios.get(`${this.backendUrl}/tabsets`, {headers: {'AuthToken': token}})
      })
  }

  getUserSubscription(): Promise<AxiosResponse<object>> {
    const auth = useAuthStore()
    return auth.getToken
      .then(token => {
        console.log("getting backend user @ url", this.backendUrl)
        return axios.get(`${this.backendUrl}/users/current`, {headers: {'AuthToken': token}})
      })
  }

  updateUser() {
    const auth = useAuthStore()
    return auth.getToken
      .then(token => {
        console.log("putting backend user @ url", this.backendUrl)
        return axios.put(`${this.backendUrl}/users/current`, auth.subscription, {headers: {'AuthToken': token}})
      })
  }
}

export default new BackendApi();
