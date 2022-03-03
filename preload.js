// 所有Node.js API都可以在预加载过程中使用。
// 它拥有与Chrome扩展一样的沙盒。
const { ipcRenderer } = require('electron')
window.addEventListener('DOMContentLoaded', () => {
    let close = document.querySelector(".close")
    close.addEventListener('click', ()=>{
        ipcRenderer.sendSync('quit')
    })
})