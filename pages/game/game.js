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
    winAmount: 0
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
    const myName = '玩家' + myId.substr(-4)
    const myCoins = app.getCoins() || 10000

    console.log('初始化游戏:', { roomId, myId, myName, myCoins })

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
    console.log('我的索引:', myIndex, '玩家列表:', game.players.map(p => p.id))

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
    console.log('开始游戏...')
    const result = this.data.game.startGame()
    if (result.success) {
      console.log('游戏启动成功，更新状态')
      this.updateGameState()
    } else {
      console.error('游戏启动失败:', result.message)
      wx.showToast({ title: result.message, icon: 'none' })
    }
  },

  updateGameState() {
    const game = this.data.game
    const myId = wx.getStorageSync('userId') || 'user_001'
    
    // 获取游戏状态（传入我的 ID，让我能看到自己的手牌）
    const state = game.getState(myId)
    const myPlayer = state.players[this.data.myIndex]

    console.log('=== 游戏状态更新 ===')
    console.log('阶段:', state.stage, STAGE_TEXTS[state.stage])
    console.log('底池:', state.pot)
    console.log('公共牌:', state.communityCards)
    console.log('我的手牌:', myPlayer.hand, '数量:', myPlayer.hand ? myPlayer.hand.length : 0)
    console.log('我的筹码:', myPlayer.chips)
    console.log('玩家列表:', state.players.map(p => ({ name: p.name, chips: p.chips, hand: p.hand })))

    const currentPlayerIndex = state.currentPlayerIndex
    const isMyTurn = currentPlayerIndex === this.data.myIndex && state.stage < GAME_STAGE.SHOWDOWN

    const toCall = state.currentBet - myPlayer.currentBet
    const canCheck = toCall === 0
    const minBet = state.minRaise
    const maxBet = myPlayer.chips

    // 更新界面
    this.setData({
      gameStage: state.stage,
      stageText: STAGE_TEXTS[state.stage],
      pot: state.pot,
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
      toCall,
      minBet,
      maxBet,
      betAmount: Math.min(minBet * 2, maxBet)
    })
    
    console.log('界面已更新，myHand:', this.data.myHand)

    // 检查游戏是否结束
    if (state.stage === GAME_STAGE.FINISHED && state.winner) {
      this.showResult(state.winner)
    }

    // 机器人自动操作
    if (!isMyTurn && state.stage < GAME_STAGE.SHOWDOWN) {
      const currentPlayer = state.players[currentPlayerIndex]
      if (currentPlayer && currentPlayer.isBot) {
        setTimeout(() => this.botAction(currentPlayer), 1000)
      }
    }
  },

  botAction(botPlayer) {
    const game = this.data.game
    const state = game.getState()
    const toCall = state.currentBet - botPlayer.currentBet

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
    this.setData({ betAmount: e.detail.value })
  },

  showResult(winner) {
    const isMyWin = winner.players.some(p => p.id === wx.getStorageSync('userId'))
    
    console.log('游戏结束，获胜者:', winner)
    
    this.setData({
      showResult: true,
      winnerText: isMyWin ? '🎉 你赢了！' : '😔 你输了',
      winnerHand: winner.hand ? { typeName: HAND_NAMES[winner.hand.type] } : null,
      winAmount: isMyWin ? winner.amount : 0
    })
  },

  nextGame() {
    this.setData({ showResult: false })
    this.startGame()
  },

  exitGame() {
    wx.navigateBack()
  }
})
