// pages/index/index.js
const app = getApp()

Page({
  data: {
    coins: 0,
    showJoinModal: false,
    roomIdInput: ''
  },

  onLoad() {
    this.updateCoins()
  },

  onShow() {
    this.updateCoins()
  },

  updateCoins() {
    const coins = app.getCoins()
    this.setData({ coins })
  },

  // 开始人机对战
  startVsBot() {
    wx.navigateTo({
      url: '/pages/game/game?mode=vsbot'
    })
  },

  // 创建房间
  createRoom() {
    const roomId = app.generateRoomId()
    wx.setStorageSync('currentRoom', {
      id: roomId,
      isHost: true,
      mode: 'friend'
    })
    
    wx.navigateTo({
      url: `/pages/room/room?roomId=${roomId}&isHost=true`
    })
  },

  // 加入房间
  joinRoom() {
    this.setData({
      showJoinModal: true,
      roomIdInput: ''
    })
  },

  onRoomIdInput(e) {
    this.setData({
      roomIdInput: e.detail.value.toUpperCase()
    })
  },

  cancelJoin() {
    this.setData({
      showJoinModal: false,
      roomIdInput: ''
    })
  },

  confirmJoin() {
    const roomId = this.data.roomIdInput.trim()
    
    if (roomId.length !== 6) {
      wx.showToast({
        title: '房间号格式错误',
        icon: 'none'
      })
      return
    }

    wx.setStorageSync('currentRoom', {
      id: roomId,
      isHost: false,
      mode: 'friend'
    })

    wx.navigateTo({
      url: `/pages/room/room?roomId=${roomId}&isHost=false`
    })

    this.setData({
      showJoinModal: false,
      roomIdInput: ''
    })
  },

  // 显示规则
  showRules() {
    wx.showModal({
      title: '德州扑克规则',
      content: '【游戏目标】\n组成最大的 5 张牌牌型\n\n【牌型大小】\n皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌\n\n【游戏流程】\n1. 发 2 张手牌\n2. 发 3 张公共牌（翻牌）\n3. 发第 4 张公共牌（转牌）\n4. 发第 5 张公共牌（河牌）\n5. 摊牌比大小\n\n【操作说明】\n弃牌：放弃本局\n过牌：不加注\n跟注：跟上前面的下注\n加注：增加下注额\n全下：押上所有金币',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
