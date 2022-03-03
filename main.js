const { net, app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const ZM = require('./ZM.js')
let zm = null

async function createWindow () {
  	let win = new BrowserWindow({
		transparent: true,
		resizable: false,
		width: 1050,
    	height: 800,
    	frame: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			//preload: path.join(__dirname, 'preload.js')
		},
  	})
	zm = new ZM(win)
	// win.webContents.openDevTools()
  	await win.loadFile('./dist/index.html')
}
//
app.whenReady().then(() => {
	//console.log(process.versions)
  	createWindow()
	app.on('activate', function () {
		// 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
		// 打开的窗口，那么程序会重新创建一个窗口。
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})
// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('quit', (event, arg) => {
	app.quit()
})

ipcMain.on('setCookie', (event, arg) => {
	zm.setCookie(arg)
	zm.getUserInfo().then(res=>{
		console.log(res)
		event.reply('setCookie', JSON.stringify(res))
	})
})

// 更新用户信息
ipcMain.on('updateUserInfo', (event, arg) => {
	zm.updateUserInfo(JSON.parse(arg)).then(res=>{
		console.log(res)
		event.reply('updateUserInfo', JSON.stringify(res))
	})
})

// 查询预约列表
ipcMain.on('getSubcribeList', (event, arg) => {
	zm.getSubcribeList().then(res=>{
		console.log(res)
		event.reply('getSubcribeList', JSON.stringify(res))
	})
})

// 查询预约详情
ipcMain.on('getSubcribeDetails', (event, arg) => {
	// console.log('jieshou', JSON.parse(arg))
	zm.getSubcribeDetails(arg).then(res=>{
		console.log(res)
		event.reply('getSubcribeDetails', JSON.stringify(res))
	})
})

// 查询预约详情
ipcMain.on('cancelSubcribe', (event, arg) => {
	// console.log('jieshou', JSON.parse(arg))
	zm.cancelSubcribe(arg).then(res=>{
		console.log(res)
		event.reply('cancelSubcribe', JSON.stringify(res))
	})
})

// 查询可预约列表
ipcMain.on('querySubcribeList', (event, arg) => {
	const param = JSON.parse(arg)
	let obj = []
	let len = -1
	let i = 0
	let dataObj = {}
	zm.canSubcribeHospital(param.cityCode, param.product, param.city).then(res1=>{
		if(res1.code == 200){
			dataObj = res1
			len = res1.data.length
			for (const item of res1.data) {
				zm.subcribeHospitalDetails(item.id).then(res2=>{
					i++
					if(res2.code == 200){
						//console.log('res2.data', res2.data)
						const find = res2.data.find(items=>items.id == param.product)
						//console.log(find)
						if(find && find.date != '暂无'){
							item.data = find
							obj.push(item)
						}
					}
				})
			}
		}
	})
	let time = 0
	let timer = setInterval(function (){
		console.log('ilen',i, len)
		if(time >= 30000){
			event.reply('querySubcribeList', JSON.stringify({code: 400, msg: '请求超时'}))
			clearInterval(timer)
		}
		if(i == len || time >= 30000){ // 超过30秒取消
			dataObj.data = obj
			event.reply('querySubcribeList', JSON.stringify(dataObj))
			clearInterval(timer)
		}
		time += 300
	}, 300)
})

// 设置
ipcMain.on('setting', (event, arg) => {
	const param = JSON.parse(arg)
	zm.setProxyEnable(param.proxy_enable)
	console.log('param', param)
	zm.setProxy(param)
	event.reply('setting')
})