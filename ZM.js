const CryptoJS = require("crypto-js")
const { Base64 } = require('js-base64')
const {net} = require("electron")

class ZM {
    constructor(win) {
        this.win = win
        this.cookie = ''
        this.key = '' // 密钥
        this.proxy = {
            ip: '',
            port: '',
            username: '',
            password: ''
        }
        this.proxy_enable = false
    }

    /**
     * 设置代理
     * @param value Object
     */
    setProxy(value){
        this.proxy = {...this.proxy, ...value}
    }

    /**
     * 启用代理
     * @param value Boolean
     */
    setProxyEnable(value){
        this.proxy_enable = value
    }

    /**
     * 设置cookie并根据cookie获取解密密钥
     */
    setCookie(cookies) {
        this.cookie = cookies
        return this
    }

    /**
     * 加密提交的参数
     * @param data
     * @returns {*}
     */
    encryptData(data){
        
    }

    /**
     * 解密返回的时间段内容获取mxid
     * @param str 解密的内容
     * @returns Object
     */
    decodeMxid(str){
        
    }

    /**
     * 网络请求
     * @param url
     * @param postdata
     * @param method
     * @returns {Promise<unknown>}
     */
    async http(url, postdata='', method='get'){
        const t = this
        let text = ''
        let session = t.win.webContents.session
        let proxy = `${t.proxy.ip}:${t.proxy.port}`
        //console.log(t.proxy_enable, t.proxy)
        if(t.proxy_enable){
            await session.setProxy({proxyRules: proxy});
        }
        return new Promise(function(resolve, reject) {
            const request = net.request({
                method: method=='GET'?'GET':'POST',
                url: url,
                session: session
            })
            request.setHeader('Referer', 'https://servicewechat.com/wx2c7f0f3c30d99445/92/page-frame.html')
            //request.setHeader('Host', 'cloud.cn2030.com')
            request.setHeader('Connection', 'keep-alive')
            request.setHeader('Cookie', t.cookie)
            request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat')
            request.setHeader('content-type', 'application/json')
            request.setHeader('zftsl', t.zftsl())
            request.setHeader('Accept-Encoding', 'gzip, deflate, br')
            if(postdata){
                request.write(postdata)
            }
            // 设置代理
            request.on('login', (authInfo, callback) => {
                console.log('authInfo', authInfo)
                callback('', '')
            })
            request.on('finish', () => {
                //console.log('Request is Finished')
            });
            request.on('abort', () => {
                resolve({code: 402, msg: '网络错误：402'})
                console.log('Request is Aborted')
            });
            request.on('error', (error) => {
                resolve({code: 401, msg: '网络错误：401'})
                console.log(`ERROR: ${JSON.stringify(error)}`)
            });
            request.on('response', (response) => {
                //console.log('headers', response.headers)
                if(response.headers['set-cookie']){
                    //console.log('新cookie', response.headers['set-cookie'][0])
                    t.setCookie(response.headers['set-cookie'][0])
                }
                response.on("data", (chunk) => {
                    // console.log("接收到数据：", chunk.toString());
                    // return JSON.parse(chunk.toString())
                    text += chunk
                })
                response.on('error', (error) => {
                    console.log(`ERROR-1: `,`${JSON.stringify(error)}`)
                    resolve({code: 400, msg: '网络错误：400'})
                })
                response.on('end', () => {
                    //console.log("数据接收完成");
                    try{
                        const obj = JSON.parse(text.toString())
                        // console.log('response', obj)
                        if(obj.status == 408){
                            resolve({code: 408, msg: 'cookie无效或已经过期'})
                        }
                        obj.code = 200
                        resolve(obj)
                    }catch (err){
                        console.log('json解码错误', text.toString())
                        resolve(text.toString())
                    }
                })
            })
            request.end()
        })
    }

    /**
     * 获取用户信息
     */
    async getUserInfo(){
        let url = 'https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=User'
        let data = await this.http(url)
        if(data.code == 200){
            return {code: 200, msg: 'success', data: data.user}
        }
        return data
    }

    /**
     * 更新用户信息
     */
    async updateUserInfo(data){
        let url = `https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=Reg&birthday=${data.birthday}&tel=${data.tel}&cname=${data.cname}&sex=${data.sex}&idcard=${data.idcard}&doctype=1`
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '修改成功'}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 获取预约列表
     */
    async getSubcribeList(){
        let url = 'https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=UserSubcribeList'
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '操作成功', data: res.list}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 获取预约详情
     */
    async getSubcribeDetails(id){
        let url = 'https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=UserSubcribeDetail&id='+id
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '操作成功', data: res}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 取消预约
     */
    async cancelSubcribe(id){
        let url = 'https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=cannel&id='+id
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '操作成功', data: res}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 获取医院可预约列表(该接口有缓存，不一定准确，需要进一步查询详情确认是否能预约)
     * @param cityCode 城市行政代码
     * @param product 疫苗类型ID，1九价；2四价；3二价进口；54二价国产
     * @param city 城市名，例：成都市
     * @returns {Promise<{msg: string, code: number}|{msg: string, code: number, data: HTMLElement}>}
     */
    async canSubcribeHospital(cityCode, product, city){
        let url = `https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=CustomerList&id=0&cityCode=${cityCode}&product=${product}&city=["","${city}"]`
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '操作成功', data: res.list}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 获取医院详情(该接口是否能预约,需要进一步根据日期查询是否有苗)
     * @param hospitalId
     * @returns {Promise<{msg: string, code: number}|{msg: string, code: number, data: HTMLElement}>}
     */
    async subcribeHospitalDetails(hospitalId){
        let url = `https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=CustomerProduct&id=${hospitalId}`
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '操作成功', data: res.list}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 获取医院可预约日期
     * @param hospitalId
     * @param product 疫苗类型ID，1九价；2四价；3二价进口；54二价国产
     * @returns {Promise<{msg: string, code: number}|{msg: string, code: number, data: HTMLElement}>}
     */
    async subcribeHospitalDate(hospitalId, product){
        let url = `https://cloud.cn2030.com/sc/wx/HandlerSubscribe.ashx?act=GetCustSubscribeDateAll&id=${hospitalId}&pid=${product}`
        let res = await this.http(url)
        if(res.code == 200){
            return {code: 200, msg: '操作成功', data: res.list}
        }else{
            return {code: 400, msg: '操作失败'}
        }
    }

    /**
     * 生成zftsl
     * @returns {*}
     */
    zftsl(){
        let c = 0
        let e = (Date.parse(new Date()) + c) / 1e3 + "";
        return CryptoJS.MD5("zfsw_" + e.substring(0, e.length - 1)).toString();
    }
}
module.exports = ZM