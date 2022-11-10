const {contextBridge, ipcRenderer} = require('electron')
const API = {
    getLocalMessage: (callback) => ipcRenderer.on("localMessage", (event, args) => {
        callback(args)
    }),
    getPhone: (callback) => ipcRenderer.on("phone", (event, args) => {
        callback(args)
    })
}
contextBridge.exposeInMainWorld("api", API)