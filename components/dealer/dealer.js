/**
 * 美女荷官组件逻辑
 */

// 荷官皮肤列表（需要替换为实际图片路径）
const DEALER_SKINS = [
  '/images/dealer/dealer1.png',
  '/images/dealer/dealer2.png',
  '/images/dealer/dealer3.png'
]

// 荷官语音提示
const DEALER_MESSAGES = {
  welcome: '欢迎来到德州扑克！祝您好运！🍀',
  yourTurn: '轮到您了~',
  goodLuck: '祝您好运！',
  winner: '恭喜您获胜！🎉',
  loser: '别灰心，再来一局！',
  allIn: '哇！全下！好刺激！',
  fold: '弃牌了，真可惜~',
  win: '太棒了！您赢了！',
  lose: '胜败乃兵家常事~'
}

Component({
  properties: {
    showDealer: {
      type: Boolean,
      value: true
    }
  },

  data: {
    dealerSkin: DEALER_SKINS[0],
    dealerMuted: false,
    isSpeaking: false,
    dealerMessage: '',
    currentSkinIndex: 0
  },

  lifetimes: {
    attached() {
      // 加载保存的设置
      const muted = wx.getStorageSync('dealerMuted')
      if (muted !== null) {
        this.setData({ dealerMuted: muted })
      }
    }
  },

  methods: {
    // 切换语音
    toggleDealerVoice() {
      const muted = !this.data.dealerMuted
      this.setData({ dealerMuted: muted })
      wx.setStorageSync('dealerMuted', muted)
      
      this.speak(muted ? '语音已关闭' : '语音已开启')
    },

    // 切换皮肤
    prevSkin() {
      let index = this.data.currentSkinIndex - 1
      if (index < 0) index = DEALER_SKINS.length - 1
      this.setSkin(index)
    },

    nextSkin() {
      let index = (this.data.currentSkinIndex + 1) % DEALER_SKINS.length
      this.setSkin(index)
    },

    setSkin(index) {
      this.setData({
        currentSkinIndex: index,
        dealerSkin: DEALER_SKINS[index]
      })
      wx.setStorageSync('dealerSkinIndex', index)
    },

    // 切换静音
    toggleMute() {
      this.toggleDealerVoice()
    },

    // 荷官说话
    speak(messageKey, customMessage) {
      if (this.data.dealerMuted) return

      const message = customMessage || DEALER_MESSAGES[messageKey]
      
      if (!message) return

      this.setData({
        dealerMessage: message,
        isSpeaking: true
      })

      // 3 秒后隐藏消息
      setTimeout(() => {
        this.setData({
          dealerMessage: '',
          isSpeaking: false
        })
      }, 3000)

      // TODO: 播放语音（需要 TTS 或预录语音）
      // wx.createInnerAudioContext().play()
    },

    // 游戏事件触发语音
    onGameEvent(event, data) {
      switch(event) {
        case 'gameStart':
          this.speak('welcome')
          break
        case 'playerTurn':
          this.speak('yourTurn')
          break
        case 'playerWin':
          this.speak('winner')
          break
        case 'playerLose':
          this.speak('loser')
          break
        case 'allIn':
          this.speak('allIn')
          break
        case 'fold':
          this.speak('fold')
          break
      }
    }
  }
})
