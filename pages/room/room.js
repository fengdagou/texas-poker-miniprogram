// pages/room/room.js
const app = getApp()

Page({
  data: {
    roomId: '',
    isHost: false,
    players: [],
    emptySlots: [1, 2, 3],
    gameStarted: false,
    canStart: false
  },

  onLoad(options) {
    const { roomId, isHost } = options
    this.setData({
      roomId,
      isHost: isHost === 'true'
    })

    // 初始化玩家列表
    const myId = wx.getStorageSync('userId')
    const myCoins = app.getCoins()
    
    this.setData({
      players: [{
        id: myId,
        name: '我',
        coins: myCoins,
        isHost: this.data.isHost,
        ready: false
      }]
    })

    // 如果是房主，模拟添加机器人
    if (this.data.isHost) {
      this.addBots()
    }
  },

  addBots() {
    const bots = [
      { id: 'bot_1', name: '机器人 Alpha', coins: 1000, isBot: true, isHost: false, ready: true },
      { id: 'bot_2', name: '机器人 Beta', coins: 1000, isBot: true, isHost: false, ready: true }
    ]

    this.setData({
      players: [...this.data.players, ...bots],
      emptySlots: [1, 2, 3],
      canStart: true
    })
  },

  startGame() {
    if (!this.data.canStart) {
      wx.showToast({
        title: '至少需要 2 名玩家',
        icon: 'none'
      })
      return
    }

    this.setData({ gameStarted: true })

    // 跳转到游戏页面
    wx.navigateTo({
      url: `/pages/game/game?roomId=${this.data.roomId}&mode=friend`
    })
  },

  inviteFriends() {
    const roomId = this.data.roomId
    
    // 生成邀请文案
    const inviteText = `快来和我一起玩转州扑克！房间号：${roomId}`
    
    // 显示房间二维码（模拟）
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    wx.showModal({
      title: '邀请好友',
      content: `房间号：${roomId}\n\n长按复制房间号，发送给好友即可邀请！`,
      confirmText: '复制房间号',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: roomId,
            success: () => {
              wx.showToast({
                title: '已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  leaveRoom() {
    wx.showModal({
      title: '确认离开',
      content: '离开后房间将解散，确定吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  }
})
