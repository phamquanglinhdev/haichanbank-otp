const {app, BrowserWindow, Notification, Tray, Menu} = require('electron')
const axios = require('axios')
const Pusher = require("pusher-js");
const prompt = require('electron-prompt');
const shell = require("electron").shell
const http = require("https")
const path = require("path")
const fs = require('fs');
let win
let tray
let chanelKey = ''
let base_url = "http://localhost:8080/api/v8/"
let phone = ''

function choose() {
    prompt({
        title: "Vui lòng đăng nhập",
        label: "lựa chọn",
        selectOptions: {
            '1': 'Đã có tài khoản',
            '2': 'OTP cho số điện thoại mới'
        },
        inputAttrs: {
            type: "select",
            require: true
        },
        type: 'select',
        alwaysOnTop: true
    }).then((r) => {
        if (r === null) {
            new Notification({"title": "Thoát ứng dụng", "body": "bye bye"}).show()
            app.quit()
        } else {
            if (r === "1") {
                inputEmail()
            } else {
                inputPhone()
            }
            // InputPassword(r)
        }
    }).catch(console.error)
}

function renderData() {
    let rawData = fs.readFileSync(path.join(__dirname, "message.json"))
    let messages = JSON.parse(rawData)
    win.webContents.send("localMessage", messages)
}

function addData(inbox) {
    let rawData = fs.readFileSync(path.join(__dirname, "message.json"))
    let messages = JSON.parse(rawData)
    let currentdate = new Date();
    let datetime = "Thời gian: " + currentdate.getDate() + "/"
        + (currentdate.getMonth() + 1) + "/"
        + currentdate.getFullYear() + " @ "
        + currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();
    let message = {
        "inbox": inbox,
        "timestamps": datetime,
    }
    messages.unshift(message)
    fs.writeFileSync(path.join(__dirname, "message.json"), JSON.stringify(messages))
    try {
        renderData()
    } catch {
        createWindow()
    }
}

function inputPhone() {
    prompt({
        title: "Nhập số điện thoại",
        label: "SĐT",
        value: "",
        inputAttrs: {
            type: "text",
            require: true
        },
        type: 'input',
        alwaysOnTop: true
    }).then((r) => {
        if (r === null) {
            new Notification({"title": "Thoát ứng dụng", "body": "bye bye"}).show()
            app.quit()
        } else {
            chanelKey = "new-" + r
            phone = r
            createWindow()
            makeTray()
            binding()
        }
    }).catch(console.error)
}

const binding = () => {
    const pusher = new Pusher('c5318d768de94b3e93c3', {
        cluster: 'ap1'
    });
    let channel = pusher.subscribe(chanelKey);
    channel.bind('get-otp', function (data) {
        showNotify("Bạn nhận được tin nhắn mới !", data.message)
        addData(data.message)
    });
}
const createWindow = () => {
    win = new BrowserWindow({
        width: 400,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        }
    })
    app.setAppUserModelId("HAICHANBANK OTP")
    win.loadFile("index.html").then(renderData).then(() => {
        win.webContents.send("phone", phone)
    })
    win.resizable = false
    win.minimizable = false
    win.menuBarVisible = false
}

function makeTray() {
    tray = new Tray(path.resolve(__dirname, "tray.jpg"));
    const contextWindow = Menu.buildFromTemplate([{
        label: "Mở ứng dụng", click: function () {
            try {
                win.show()
            } catch {
                createWindow()
            }
        },
    }, {
        label: "Thoát", click: function () {
            app.quit()
        },
    }])
    tray.setToolTip("Haichanbank OTP")
    tray.setContextMenu(contextWindow)
}

function inputEmail() {
    prompt({
        title: "Vui lòng đăng nhập",
        label: "Email",
        value: "phamquanglinhdev@gmail.com",
        inputAttrs: {
            type: "text",
            require: true
        },
        type: 'input',
        alwaysOnTop: true
    }).then((r) => {
        if (r === null) {
            new Notification({"title": "Thoát ứng dụng", "body": "bye bye"}).show()
            app.quit()
        } else {
            InputPassword(r)
        }
    }).catch(console.error)
}

function InputPassword(email) {
    prompt({
        title: "Nhập mật khẩu",
        label: "Mật khẩu",
        value: "Linhz123@",
        inputAttrs: {
            type: "password",
            require: true
        },
        type: 'input',
        alwaysOnTop: true
    }).then((r) => {
        if (r === null) {
            new Notification({"title": "Thoát ứng dụng", "body": "bye bye"}).show()
            app.quit()
        } else {
            axios.get(base_url + "channel?email=" + email + "&password=" + r).then(function (response) {
                chanelKey = response.data.channel
                phone = response.data.phone
                console.log(response)
                createWindow()
                makeTray()
                binding()
                win.webContents.send("phone", phone)
            }).catch(function (error) {
                console.log(error)
                inputEmail()
            })
        }
    }).catch(console.error)
}

const showNotify = (title = "Thông báo chào mừng", body = "Xin chào, đây là OTP Haichanbank") => {
    const notify = new Notification({
        "title": title,
        "body": body,
    })
    notify.show()
}

app.whenReady().then(choose)

app.on('window-all-closed', () => {

})

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})