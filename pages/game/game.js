// pages/game/game.js - 修复版
const app = getApp()
const { GameState, Player, GAME_STAGE, ACTION } = require('../../utils/game.js')
const { HAND_NAMES } = require('../../utils/poker.js')

const STAGE_TEXTS = {
  0: '等待开始',
  1: '翻牌前',
  2: '翻牌',
  3: '转牌',
  4: '河牌',
  5: '摊牌',
  6: '结束'
}

const DEALING_MESSAGES = [
  { text: '发牌中...', voice: 'dealer-1.mp3' },
  { text: '祝你好运 🍀', voice: 'dealer-2.mp3' },
  { text: '精彩的对局即将开始', voice: 'dealer-3.mp3' },
  { text: 'Victoria 为你发牌', voice: 'dealer-4.mp3' },
  { text: '准备好迎接好运了吗？', voice: 'dealer-5.mp3' }
]

// 内部音频上下文（用于播放语音和音效）
let innerAudioContext = null
let hintAudioContext = null

Page({
  data: {
    game: null,
    myIndex: 0,
    isMyTurn: false,
    gameStage: 0,
    stageText: '',
    pot: 0,
    communityCards: [],
    players: [],
    myHand: [],
    myName: '',
    myChips: 0,
    myCurrentBet: 0,
    roomId: null,
    betAmount: 20,
    minBet: 20,
    maxBet: 100,
    canCheck: false,
    toCall: 0,
    showResult: false,
    winnerText: '',
    winnerHand: null,
    winAmount: 0,
    allPlayers: [],
    communityCards: [],
    isDealing: false,
    dealingMessage: ''
  },

  onLoad(options) {
    const { mode, roomId } = options
    this.setData({ 
      roomId: roomId || null,
      mode: mode || 'vsbot'
    })
    this.initGame()
  },

  initGame() {
    const roomId = this.data.roomId || app.generateRoomId()
    const myId = wx.getStorageSync('userId') || 'user_001'
    const myName = wx.getStorageSync('nickName') || '玩家'
    const myCoins = app.getCoins() || 10000

    console.log('初始化游戏:', { 
      roomId, 
      myId, 
      myName, 
      myCoins,
      userIdExists: !!wx.getStorageSync('userId')
    })

    // 创建游戏状态
    const game = new GameState(roomId, myId, { small: 10, big: 20 })

    // 添加自己
    const myPlayer = new Player(myId, myName, myCoins, false)
    game.addPlayer(myPlayer)

    // 添加机器人对手
    const botNames = ['机器人 Alpha', '机器人 Beta']
    for (let i = 0; i < 2; i++) {
      const bot = new Player('bot_' + i, botNames[i], 1000, true)
      game.addPlayer(bot)
    }

    // 找到我的索引
    const myIndex = game.players.findIndex(p => p.id === myId)
    console.log('我的索引:', myIndex)
    console.log('玩家列表:', game.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot })))
    console.log('庄家索引:', game.dealerIndex)
    console.log('当前玩家索引:', game.currentPlayerIndex)

    // 初始化界面
    this.setData({
      game,
      myIndex,
      myName: myName || '玩家',
      roomId,
      pot: 0,
      communityCards: [],
      players: game.players.map(p => ({
        name: p.name || '玩家',
        chips: p.chips || 0,
        isBot: p.isBot,
        isFolded: false,
        lastAction: ''
      })),
      myHand: [],
      myChips: myCoins || 10000,
      myCurrentBet: 0,
      stageText: '等待开始',
      gameStage: 0
    })

    // 自动开始游戏
    setTimeout(() => this.startGame(), 500)
  },

  startGame() {
    console.log('=================================')
    console.log('=== 开始游戏 ===')
    console.log('=================================')
    
    // 显示荷官发牌动画
    this.showDealingAnimation()
    
    const result = this.data.game.startGame()
    if (result.success) {
      console.log('✅ 游戏启动成功')
      console.log('庄家索引:', this.data.game.dealerIndex)
      console.log('当前玩家索引:', this.data.game.currentPlayerIndex)
      console.log('玩家列表:', this.data.game.players.map(p => ({ 
        id: p.id, 
        name: p.name, 
        isBot: p.isBot,
        chips: p.chips 
      })))
      console.log('我的索引:', this.data.myIndex)
      
      // 立即更新一次界面，显示盲注
      console.log('📞 第一次调用 updateGameState')
      this.updateGameState()
      
      // 发牌动画结束后再更新一次（显示手牌）
      setTimeout(() => {
        console.log('📞 发牌动画结束，第二次调用 updateGameState')
        this.updateGameState()
        
        // 额外检查：如果当前是机器人回合，直接触发
        const currentPlayer = this.data.game.players[this.data.game.currentPlayerIndex]
        console.log('额外检查当前玩家:', currentPlayer ? currentPlayer.name : 'null', '是否机器人:', currentPlayer ? currentPlayer.isBot : false)
        if (currentPlayer && currentPlayer.isBot) {
          console.log('🤖 直接触发机器人操作')
          this.botAction(currentPlayer)
        }
      }, 2500)
    } else {
      console.error('游戏启动失败:', result.message)
      wx.showToast({ title: result.message, icon: 'none' })
      this.setData({ isDealing: false })
    }
  },

  showDealingAnimation() {
    const randomIndex = Math.floor(Math.random() * DEALING_MESSAGES.length)
    const randomMessage = DEALING_MESSAGES[randomIndex]
    
    this.setData({
      isDealing: true,
      dealingMessage: randomMessage.text
    })
    
    // 播放荷官语音
    this.playDealerVoice(randomMessage.voice)
    
    // 2.5 秒后隐藏动画
    setTimeout(() => {
      this.setData({ isDealing: false })
    }, 2500)
  },

  playDealerVoice(voiceFile) {
    try {
      // 创建内部音频上下文
      if (!innerAudioContext) {
        innerAudioContext = wx.createInnerAudioContext()
        innerAudioContext.autoplay = false
        innerAudioContext.onError((res) => {
          console.log('语音播放失败:', res)
        })
      }
      
      const voicePath = `/sounds/dealer/${voiceFile}`
      console.log('播放荷官语音:', voicePath)
      
      innerAudioContext.src = voicePath
      innerAudioContext.play()
    } catch (error) {
      console.log('语音播放异常:', error)
    }
  },

  playActionHint() {
    try {
      // 创建提示音音频上下文
      if (!hintAudioContext) {
        hintAudioContext = wx.createInnerAudioContext()
        hintAudioContext.autoplay = false
        hintAudioContext.volume = 0.6
        hintAudioContext.onError((res) => {
          console.log('提示音播放失败:', res)
        })
      }
      
      // 使用系统提示音（叮的一声）
      // 微信小程序有内置音效，这里用简单的 beep
      const beepPath = 'https://downsc.chinaz.net/Files/DownLoad/sound1/201601/6699.wav'
      console.log('播放出牌提示音')
      
      hintAudioContext.src = beepPath
      hintAudioContext.play()
      
      // 震动反馈
      wx.vibrateShort({
        type: 'light',
        fail: (err) => console.log('震动失败:', err)
      })
    } catch (error) {
      console.log('提示音播放异常:', error)
    }
  },

  onUnload() {
    // 页面卸载时清理音频
    if (innerAudioContext) {
      innerAudioContext.destroy()
      innerAudioContext = null
    }
    if (hintAudioContext) {
      hintAudioContext.destroy()
      hintAudioContext = null
    }
  },

  updateGameState() {
    const game = this.data.game
    const myId = wx.getStorageSync('userId') || 'user_001'
    
    console.log('=================================')
    console.log('=== 开始更新游戏状态 ===')
    console.log('=================================')
    console.log('我的 ID:', myId)
    console.log('我的索引:', this.data.myIndex)
    console.log('玩家总数:', game.players.length)
    console.log('游戏阶段:', game.stage)
    console.log('当前玩家索引:', game.currentPlayerIndex)
    
    // 获取游戏状态（传入我的 ID，让我能看到自己的手牌）
    const state = game.getState(myId)
    
    console.log('状态中的玩家数:', state.players.length)
    console.log('当前玩家索引 (state):', state.currentPlayerIndex)
    console.log('状态中的所有玩家:', state.players.map(p => ({ 
      id: p.id, 
      name: p.name, 
      isBot: p.isBot,
      isFolded: p.isFolded,
      chips: p.chips 
    })))
    
    const myPlayer = state.players[this.data.myIndex]
    
    console.log('我的玩家对象:', myPlayer)
    console.log('我的手牌:', myPlayer ? myPlayer.hand : 'myPlayer 是 undefined')
    console.log('我的手牌数量:', myPlayer && myPlayer.hand ? myPlayer.hand.length : 0)

    const currentPlayerIndex = state.currentPlayerIndex
    const isMyTurn = currentPlayerIndex === this.data.myIndex && state.stage < GAME_STAGE.SHOWDOWN

    const toCall = (state.currentBet || 0) - (myPlayer.currentBet || 0)
    const canCheck = toCall === 0
    const minRaise = state.minRaise || 20
    const maxBet = myPlayer.chips || 100

    // 检查是否轮到玩家
    const wasMyTurn = this.data.isMyTurn
    const isNowMyTurn = isMyTurn && !wasMyTurn
    
    // 更新界面
    this.setData({
      gameStage: state.stage || 0,
      stageText: STAGE_TEXTS[state.stage] || '等待开始',
      pot: state.pot || 0,
      communityCards: state.communityCards || [],
      players: state.players.map(p => ({
        name: p.name || '未知玩家',
        chips: p.chips || 0,
        currentBet: p.currentBet || 0,
        isBot: p.isBot,
        isFolded: p.isFolded,
        lastAction: p.lastAction || ''
      })),
      myHand: myPlayer.hand && myPlayer.hand.length > 0 ? myPlayer.hand : [],
      myChips: myPlayer.chips || 0,
      myCurrentBet: myPlayer.currentBet || 0,
      isMyTurn,
      canCheck,
      toCall: toCall || 0,
      minBet: minRaise || 20,
      maxBet: maxBet || 100,
      betAmount: Math.min((minRaise || 20) * 2, (maxBet || 100))
    })
    
    // 如果是玩家的回合，播放提示音
    if (isNowMyTurn && isMyTurn) {
      this.playActionHint()
    }
    
    console.log('玩家下注信息:', state.players.map(p => ({ name: p.name, currentBet: p.currentBet, lastAction: p.lastAction })))
    console.log('界面已更新，myHand:', this.data.myHand)

    // 检查游戏是否结束
    if (state.stage === GAME_STAGE.FINISHED && state.winner) {
      this.showResult(state.winner)
    }

    // 机器人自动操作 - 使用 game.players 而不是 state.players
    console.log('🤖 检查机器人操作条件:', {
      isMyTurn,
      stage: game.stage,
      currentPlayerIndex: game.currentPlayerIndex,
      showndownLimit: GAME_STAGE.SHOWDOWN
    })
    
    if (!isMyTurn && game.stage < GAME_STAGE.SHOWDOWN) {
      // 直接使用 game.players 获取当前玩家
      const currentPlayer = game.players[game.currentPlayerIndex]
      console.log('当前玩家:', { 
        name: currentPlayer ? currentPlayer.name : 'null',
        id: currentPlayer ? currentPlayer.id : 'null',
        isBot: currentPlayer ? currentPlayer.isBot : false,
        isFolded: currentPlayer ? currentPlayer.isFolded : false
      })
      
      if (currentPlayer && currentPlayer.isBot && !currentPlayer.isFolded) {
        console.log('✅ 触发机器人操作:', currentPlayer.name)
        setTimeout(() => {
          console.log('🤖 执行机器人操作:', currentPlayer.name)
          this.botAction(currentPlayer)
        }, 500)
      } else {
        console.log('❌ 不触发机器人操作，原因:', {
          hasCurrentPlayer: !!currentPlayer,
          isBot: currentPlayer ? currentPlayer.isBot : 'N/A',
          isFolded: currentPlayer ? currentPlayer.isFolded : 'N/A'
        })
      }
    } else {
      console.log('❌ 不满足机器人操作条件:', { 
        isMyTurn, 
        stage: game.stage,
        stageLtShowdown: game.stage < GAME_STAGE.SHOWDOWN
      })
    }
  },

  botAction(botPlayer) {
    const game = this.data.game
    const state = game.getState()
    const toCall = state.currentBet - botPlayer.currentBet

    console.log('机器人决策:', { 
      name: botPlayer.name, 
      toCall, 
      chips: botPlayer.chips,
      currentBet: botPlayer.currentBet 
    })

    let action = ACTION.CHECK
    let amount = 0
    const random = Math.random()

    if (toCall > 0) {
      if (random < 0.1) action = ACTION.FOLD
      else if (random < 0.7) action = ACTION.CALL
      else {
        action = ACTION.RAISE
        amount = Math.min(toCall * 2, botPlayer.chips)
      }
    } else {
      if (random < 0.6) action = ACTION.CHECK
      else {
        action = ACTION.RAISE
        amount = Math.min(state.blinds.big * 2, botPlayer.chips)
      }
    }

    game.playerAction(botPlayer.id, action, amount)
    this.updateGameState()
  },

  // 玩家操作
  fold() {
    this.data.game.playerAction(wx.getStorageSync('userId'), ACTION.FOLD)
    this.updateGameState()
  },

  check() {
    this.data.game.playerAction(wx.getStorageSync('userId'), ACTION.CHECK)
    this.updateGameState()
  },

  call() {
    this.data.game.playerAction(wx.getStorageSync('userId'), ACTION.CALL)
    this.updateGameState()
  },

  raise() {
    const amount = this.data.betAmount
    this.data.game.playerAction(wx.getStorageSync('userId'), ACTION.RAISE, amount)
    this.updateGameState()
  },

  allIn() {
    this.data.game.playerAction(wx.getStorageSync('userId'), ACTION.ALL_IN)
    this.updateGameState()
  },

  onBetChange(e) {
    this.setData({ 
      betAmount: e.detail.value,
      presetIndex: -1
    })
  },

  // 设置快捷下注金额
  setBetAmount(e) {
    const amount = e.currentTarget.dataset.amount
    this.setData({ 
      betAmount: amount,
      presetIndex: [20, 50, 100, 200].indexOf(amount)
    })
  },

  showResult(winner) {
    const myId = wx.getStorageSync('userId') || 'user_001'
    const isMyWin = winner.players.some(p => p.id === myId)
    
    // 获取游戏状态（包括公共牌和所有玩家手牌）
    const state = this.data.game.getState(myId)
    
    const allPlayers = state.players.map(p => ({
      id: p.id,
      name: p.name,
      hand: p.hand || [],
      isFolded: p.isFolded
    }))
    
    console.log('游戏结束，公共牌:', state.communityCards)
    console.log('游戏结束，所有玩家手牌:', allPlayers)
    
    this.setData({
      showResult: true,
      winnerText: isMyWin ? '🎉 你赢了！' : '😔 你输了',
      winnerHand: winner.hand ? { typeName: HAND_NAMES[winner.hand.type] } : null,
      winAmount: isMyWin ? winner.amount : 0,
      allPlayers: allPlayers,
      communityCards: state.communityCards || []
    })
  },

  nextGame() {
    this.setData({ showResult: false })
    this.startGame()
  },

  exitGame() {
    wx.navigateBack()
  },

  // 获取花色样式类
  getSuitClass(suit) {
    if (!suit) return ''
    // 返回具体的花色类名，用于 CSS 着色
    if (suit === '♥') return 'hearts'
    if (suit === '♦') return 'diamonds'
    if (suit === '♠') return 'spades'
    if (suit === '♣') return 'clubs'
    return ''
  }
})
