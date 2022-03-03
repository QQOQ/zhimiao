const { ipcRenderer } = require('electron')
const $ = require('./jquery.min.js')

$(document).ready(function () {
    let modalEvent = ''
    let hospitalList = []
    let config = {
        proxy_enable: localStorage.getItem('proxy_enable') || 0, // 是否开启代理
        proxy: {
            username: localStorage.getItem('proxy_username') || '',
            password: localStorage.getItem('proxy_password') || '',
            ip: localStorage.getItem('proxy_ip') || '',
            port: localStorage.getItem('proxy_port') || ''
        },
        start: 0, // 开启预约，1开启0关闭
        sex: 1, // 性别，1男2女
        cityCode: '', // 城市行政编码
        product: '', // 疫苗类型ID
        city: '', // 城市中文名
        num: '', // 针次
        // birthday: '', // 生日
        // tel: '', // 电话
        // cname: '', // 姓名
        // idcard: '', // 身份证号码
        // doctype: '', // 证件类型，1为身份证,2护照,3港澳证件,4台胞证
    }

    function init(){
        const radio_group = $(".radio_group[data-radio]")
        for (const item of radio_group) {
            let name = $(item).attr('data-radio')
            // console.log(config[name])
            setRadio(name, config[name])
        }
        $("body").on('click','.radio_box div', function(e){
            if($(this).hasClass('on')){
                return
            }
            const parent = $(this).parents('.radio_group')
            let val = $(this).attr('data-id')
            setRadio($(parent).attr('data-radio'), val)
        })

        let proxy_data = {...config.proxy, proxy_enable:config.proxy_enable==1?true:false}
        console.log('proxy_data', proxy_data)
        ipcRenderer.send('setting', JSON.stringify(proxy_data))
    }

    init()

    // 关闭
    $(".close").click(function (){
        ipcRenderer.sendSync('quit')
    })

    // 设置radio
    function setRadio(radioName, val){
        console.log(radioName, val)
        let ele = $(".radio_group[data-radio='"+radioName+"']")
        config[radioName] = val
        if(val == 1){
            $(ele).find(".radio_box_r").removeClass('on')
            $(ele).find(".radio_box_l").addClass('on')
            $(ele).find('.slider').css('left', '5px')
        }else{
            $(ele).find(".radio_box_l").removeClass('on')
            $(ele).find(".radio_box_r").addClass('on')
            $(ele).find('.slider').css('left', '60px')
        }
    }

    $(".mask").click(()=>{
        $(".popup_content").addClass('animate__flipOutX')
        setTimeout(()=>{
            $(".popup_content").removeClass('animate__flipOutX').html('')
            $("#popup").removeClass('show')
        }, 500)
    })

    function showPopup(html, width=360, height='auto'){
        $(".popup_content").css({width: width, height: height}).html(html)
        $("#popup").addClass('show')
    }

    $(".help").click(()=>{
        let html = '<div class="help_content">\n' +
            '                <div class="help_title">知苗小助手</div>\n' +
            '                <div class="help_ver">Ver 0.0.1</div>\n' +
            '                <div class="help_text">仅供交流使用，切勿用于商业用途。</div>\n' +
            '            </div>'
        showPopup(html)
    })

    // 载入省市区
    let provinceStr = ''
    for (const item of city) {
        if(item.code != '710000' && item.code != '810000' && item.code != '820000'){ // 跳过港澳台
            provinceStr += `<div class="select_scroll_li" data-code="${item.code}">${item.value}</div>`
        }
    }
    $("#province").html(provinceStr)
    $("#province .select_scroll_li").on('click', function(e){
        let cityStr = ''
        config.cityCode = ''
        config.city = ''
        const code = $(this).attr('data-code')
        let children = city.find(item=>item.code==code)
        if(children){
            $("#city").parents('.select').find('.select_view_l').text('选择市')
            if(children.code == 110000 || children.code == 120000 || children.code == 310000 || children.code == 500000){
                cityStr += `<div class="select_scroll_li" data-name="${children.value}" data-code="${children.code}">全市</div>`
            }
            for (const item of children.children) {
                cityStr += `<div class="select_scroll_li" data-name="${item.value}" data-code="${item.code}">${item.value}</div>`
            }
            $("#city").html(cityStr)
        }
    })

    $(".select_scroll").on('click', '.select_scroll_li', function(e){
        const code = $(this).attr('data-code')
        const name = $(this).attr('data-name')
        if(code){
            let p = $(this).parent().attr('id')
            if(p == 'city'){
                config.cityCode = code
                config.city = name
            }else if(p == 'product'){
                config.product = code
            }else if(p == 'num'){
                config.num = code
            }
            console.log(config)
            $(this).parents('.select').find('.select_view_l').text($(this).text())
        }
        $(this).parents('.select').removeClass('on')
        e.stopPropagation();
    })

    $("#clear").click(function (){
        $("#cookie_textarea").val('')
    })

    // select
    $(".select").click(function(e){
        $(this).addClass('on')
    })

    $(".select").mouseleave(function(e){
        $(this).removeClass('on')
    })

    function showModal(eventName, text){
        modalEvent = eventName
        $(".modal_text").text(text)
        $("#modal").show()
    }

    $(".cancel").click(function (){
        modalEvent = ''
        $("#modal").hide()
    })

    $(".confirm").click(function (){
        switch (modalEvent) {
            case "setCookie":
                //setCookie()
        }
        modalEvent = ''
        $("#modal").hide()
    })

    // 保存cookie获取用户信息
    $("#userinfo").click(function (){
        if($(this).hasClass('disable')){
            return
        }
        const cookie = $("#cookie_textarea").val()
        if(cookie == ''){
            showModal('eventName', '请填入cookie')
            return
        }
        $(this).addClass('disable')
        $(this).html('<i class="iconfont icon-loading rotate"></i>')
        ipcRenderer.send('setCookie', cookie)
    })
    ipcRenderer.on('setCookie', (event, arg) => {
        console.log(arg)
        const data = JSON.parse(arg)
        $("#userinfo").removeClass('disable').html('保存')
        if(data.code != 200){
            $("#username").val('')
            $("#birthday").val('')
            $("#tel").val('')
            $("#idcard").val('')
            setRadio('sex', 1)
            showModal('', data.msg)
        }else{
            $("#username").val(data.data.cname)
            $("#birthday").val(data.data.birthday)
            $("#tel").val(data.data.tel)
            $("#idcard").val(data.data.idcard)
            setRadio('sex', data.data.sex)
            getSubcribeList()
        }
    })

    // 更新用户信息
    $("#updateUserInfo").click(function (){
        if($(this).hasClass('disable')){
            return
        }
        const cookie = $("#cookie_textarea").val()
        if(cookie == ''){
            showModal('', '请先设置cookie')
            return
        }
        let data = {}
        data.cname = $("#username").val()
        data.birthday = $("#birthday").val()
        data.tel = $("#tel").val()
        data.idcard = $("#idcard").val()
        data.sex = config.sex
        if(data.cname == ''){
            showModal('', '请填写姓名')
            return
        }
        if(data.birthday == ''){
            showModal('', '请填写出生日期')
            return
        }
        if(data.tel == ''){
            showModal('', '请填写电话号码')
            return
        }
        if(data.idcard == ''){
            showModal('', '请填写身份证号码')
            return
        }
        $(this).addClass('disable')
        $(this).html('<i class="iconfont icon-loading rotate"></i>')
        ipcRenderer.send('updateUserInfo', JSON.stringify(data))
    })
    ipcRenderer.on('updateUserInfo', (event, arg) => {
        console.log(arg)
        const data = JSON.parse(arg)
        $("#updateUserInfo").removeClass('disable').html('更新资料')
        showModal('', data.msg)
    })

    // 获取预约列表
    function getSubcribeList(){
        const btnEle = $("#getSubcribeList")
        if(btnEle.hasClass('disable')){
            return
        }
        btnEle.addClass('disable')
        btnEle.html('<i class="iconfont icon-loading rotate"></i>')
        ipcRenderer.send('getSubcribeList')
    }

    $("#getSubcribeList").click(function (){
        getSubcribeList()
    })

    ipcRenderer.on('getSubcribeList', (event, arg) => {
        const data = JSON.parse(arg)
        console.log('data.data', data.data)
        $("#getSubcribeList").removeClass('disable').html('刷新')
        if(data.code == 200){
            //subcribeList = data.data
            let html = ''
            for (const item of data.data) {
                html += '<tr class="table_tr">'
                html += '<td class="table_td">'+item.cname+'</td>'
                html += '<td class="table_td">'+item.cdate+'</td>'
                html += '<td class="table_td">'+item.product+'</td>'
                html += '<td class="table_td"><div class="tag '+(item.isCancel?"yellow_bg":"green_bg")+'">'+(item.isCancel?"已取消":"成功")+'</div></td>'
                html += '<td class="table_td action">'
                if(!item.isCancel){
                    html += '<a class="subcribe_cancel" data-id="'+item.id+'">取消</a>'
                }
                html += '<a class="subcribe_details" data-id="'+item.id+'">详情</a></td>'
                html += '</tr>'
            }
            $("#subscribe .table_body").html(html)
        }
    })

    // 取消预约
    $("body").on('click','.subcribe_cancel', function(e){
        const id = $(this).attr('data-id')
        ipcRenderer.send('cancelSubcribe', id)
    })

    ipcRenderer.on('cancelSubcribe', (event, arg) => {
        let data = JSON.parse(arg)
        if(data.code == 200) {
            getSubcribeList()
        }else{
            showModal('', '取消预约失败')
        }
    })

    // 查看预约详情
    $("body").on('click','.subcribe_details', function(e){
        const id = $(this).attr('data-id')
        let html = '<div class="popup_subcribe_details">\n' +
            '                        <div class="loadingtext">\n' +
            '                            <i class="iconfont icon-loading rotate"></i>\n' +
            '                            <p>loading...</p>\n' +
            '                        </div>\n' +
            '                    </div>'
        showPopup(html, 360)
        ipcRenderer.send('getSubcribeDetails', id)
    })

    ipcRenderer.on('getSubcribeDetails', (event, arg) => {
        let html = ''
        let data = JSON.parse(arg)
        if(data.code == 200) {
            data = data.data
            html = `<div class="popup_subcribe_details"><h2 class="title"><span>个人信息</span></h2><div class="popup_subcribe_details_con"><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">姓名</div><div class="popup_subcribe_details_td">${data.username}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">证件类型</div><div class="popup_subcribe_details_td">${data.doctype}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">手机号</div><div class="popup_subcribe_details_td">${data.tel}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">性别</div><div class="popup_subcribe_details_td">${data.sex == 1 ? '男' : '女'}</div></div></div><h2 class="title mt20"><span>预约信息</span></h2><div class="popup_subcribe_details_con"><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">预约状态</div><div class="popup_subcribe_details_td">${data.isCancel ? '已取消' : '预约成功'}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">预约编号</div><div class="popup_subcribe_details_td">${data.Fnumber}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">预约地点</div><div class="popup_subcribe_details_td">${data.cname}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">申请时间</div><div class="popup_subcribe_details_td">${data.cdate}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">接种时间</div><div class="popup_subcribe_details_td">${data.VaccineDate}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">预约项目</div><div class="popup_subcribe_details_td">${data.product}</div></div><div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">预约针次</div><div class="popup_subcribe_details_td">第${data.FTime}针</div></div></div></div>`
            console.log('huidiao', data)
            $(".popup_content").html(html)
        }else{
            html += '<div class="popup_subcribe_details"><div class="loadingtext"><p>'+data.msg+'</p></div></div>'
            $(".popup_content").html(html)
        }
    })

    // 查询疫苗
    $("#query").click(function (){
        if($(this).hasClass('disable')){
            return
        }
        if(config.cityCode == ''){
            showModal('', '请先选择要查询的城市')
            return
        }
        if(config.product == ''){
            showModal('', '请选择要查询的疫苗类型')
            return
        }
        if(config.num == ''){
            showModal('', '请选择要查询的针次')
            return
        }
        $(this).addClass('disable')
        $(this).html('<i class="iconfont icon-loading rotate"></i>')
        const data = {
            cityCode: config.cityCode,
            product: config.product,
            num: config.num,
            city: config.city
        }
        console.log(data)
        ipcRenderer.send('querySubcribeList', JSON.stringify(data))
    })

    ipcRenderer.on('querySubcribeList', (event, arg) => {
        let html = ''
        let data = JSON.parse(arg)
        console.log(data)
        if(data.code == 200) {
            hospitalList = data.data
            for (const item of data.data) {
                html += '<tr class="table_tr">'
                html += '<td class="table_td">'+item.cname+'</td>'
                html += '<td class="table_td">'+item.data.date+'</td>'
                html += '<td class="table_td">'+item.data.price+'</td>'
                html += '<td class="table_td action">'
                html += '<a class="hospital_details" data-id="'+item.id+'">详情</a></td>'
                html += '</tr>'
            }
            $("#hospital .table_body").html(html)
        }else{
            showModal('', data.msg)
        }
        $("#query").removeClass('disable').html('<i class="iconfont icon-sousuo"></i> 查询')
    })

    // 查看详情
    $("body").on('click','.hospital_details', function(e){
        const id = $(this).attr('data-id')
        let data = hospitalList.find(item=>item.id == id)
        let html = ''
        html = `<div class="popup_subcribe_details">
	<div class="popup_subcribe_details_con">
		<div class="popup_subcribe_details_tr">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				机构名称
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
				${data.cname}
			</div>
		</div>
		<div class="popup_subcribe_details_tr">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				地址
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
				${data.addr}
			</div>
		</div>
		<div class="popup_subcribe_details_tr">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				电话
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
				${data.tel}
			</div>
		</div>
		<div class="popup_subcribe_details_tr">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				产品名称
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
				${data.data.text}
			</div>
		</div>`
        if(data.tags.length > 0){
            html += `<div class="popup_subcribe_details_tr"><div class="popup_subcribe_details_td popup_subcribe_details_td_l">标签</div><div class="popup_subcribe_details_td popup_subcribe_details_td_r">`
            for (let i = 0; i < data.data.tags.length; i++) {
                html += '<div class="tag green_bg mr5">'+data.data.tags[i]+'</div>'
            }
            html += '</div></div>'
        }
		html += `<div class="popup_subcribe_details_tr">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				公告
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
				${data.notice}
			</div>
		</div>
		<div class="popup_subcribe_details_tr">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				预约时间段
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
				${data.data.date}
			</div>
		</div>
	</div>
</div>`
        console.log('huidiao', data)
        $(".popup_content").html(html)
        showPopup(html, 360)
    })

    // 设置
    $(".setting").click(function (){
        let proxy_username = localStorage.getItem('proxy_username') || ''
        let proxy_password = localStorage.getItem('proxy_password') || ''
        let proxy_ip = localStorage.getItem('proxy_ip') || ''
        let proxy_port = localStorage.getItem('proxy_port') || ''
        let proxy_enable = localStorage.getItem('proxy_enable') || 0
        let html = ''
        html = `<div class="popup_subcribe_details">
	<div class="popup_subcribe_details_con">
		<div class="popup_subcribe_details_tr align-items-center">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				开启代理
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
			    <div class="radio_group" data-radio="proxy_enable">
                    <div class="radio_box">
                        <div class="radio_box_l" data-id="1">开</div>
                        <div class="radio_box_r" data-id="0">关</div>
                        <div class="slider"></div>
                    </div>
                </div>
			</div>
		</div>
		<div class="popup_subcribe_details_tr align-items-center">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				代理地址
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
			    <input type="text" id="proxy_ip" placeholder="代理地址" value="${proxy_ip}">
			</div>
		</div>
		<div class="popup_subcribe_details_tr align-items-center">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				代理端口
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
			    <input type="text" id="proxy_port" placeholder="代理端口" value="${proxy_port}">
			</div>
		</div>
		<div class="popup_subcribe_details_tr align-items-center">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				用户名
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
			    <input type="text" id="proxy_username" placeholder="用户名" value="${proxy_username}">
			</div>
		</div>
		<div class="popup_subcribe_details_tr align-items-center">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				密码
			</div>
			<div class="popup_subcribe_details_td popup_subcribe_details_td_r">
			    <input type="text" id="proxy_password" placeholder="密码" value="${proxy_password}">
			</div>
		</div>
		<div class="popup_subcribe_details_tr align-items-center justify-content-space-between">
			<div class="popup_subcribe_details_td popup_subcribe_details_td_l">
				
			</div>
			<div class="popup_subcribe_details_td">
			    <div class="btn setting_btn">保存</div>
			</div>
		</div>
	</div>
</div>`
        $(".popup_content").html(html)
        setTimeout(()=>{
            setRadio('proxy_enable', proxy_enable)
        },500)
        showPopup(html, 360)
    })

    // 保存设置
    $("body").on('click','.setting_btn', function(e){
        if($(this).hasClass('disable')){
            return
        }
        let proxy_ip = $("#proxy_ip").val()
        let proxy_port = $("#proxy_port").val()
        let proxy_username = $("#proxy_username").val()
        let proxy_password = $("#proxy_password").val()
        if(config.proxy_enable==1){
            if(proxy_ip == ''){
                showModal('', '请先填写代理地址')
                return
            }
            if(proxy_port == ''){
                showModal('', '请先填写代理端口')
                return
            }
        }
        $(this).addClass('disable')
        $(this).html('<i class="iconfont icon-loading rotate"></i>')
        localStorage.setItem('proxy_enable', config.proxy_enable)
        localStorage.setItem('proxy_username', proxy_username)
        localStorage.setItem('proxy_ip', proxy_ip)
        localStorage.setItem('proxy_port', proxy_port)
        localStorage.setItem('proxy_password', proxy_password)
        const data = {
            proxy_enable: config.proxy_enable==1?true:false,
            ip: proxy_ip,
            username: proxy_username,
            port: proxy_port,
            password: proxy_password
        }
        ipcRenderer.send('setting', JSON.stringify(data))
    })

    ipcRenderer.on('setting', (event, arg) => {
        $(".setting_btn").removeClass('disable').html('保存')
        $(".mask").click()
    })
})