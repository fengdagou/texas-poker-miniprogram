// pages/game/game.js
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

    // 创建游戏状态
    const game = new GameState(roomId, myId, { small: 10, big: 20 })

    // 添加自己
    const myPlayer = new Player(myId, myName, myCoins, false)
    game.addPlayer(myPlayer)

    // 添加机器人对手
    const botNames = ['机器人 Alpha', '机器人 Beta', '机器人 Gamma']
    for (let i = 0; i < 2; i++) {
      const bot = new Player(
        'bot_' + i, 
        botNames[i], 
        1000, 
        true
      )
      game.addPlayer(bot)
    }

    // 找到我的索引
    const myIndex = game.players.findIndex(p => p.id === myId)

    // 初始化底池和公共牌
    this.setData({
      game,
      myIndex,
      myName,
      roomId,
      pot: 0,
      communityCards: [],
      players: game.players.map(p => p.toJSON()),
      myHand: [],
      myChips: myCoins,
      myCurrentBet: 0,
      stageText: '等待开始',
      gameStage: 0
    })

    // 自动开始游戏
    setTimeout(() => this.startGame(), 500)
  },

  startGame() {
    const result = this.data.game.startGame()
    if (result.success) {
      this.updateGameState()
    } else {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
    }
  },

  updateGameState() {
    const game = this.data.game
    const myId = wx.getStorageSync('userId') || 'user_001'
    const state = game.getState(myId)
    const myPlayer = state.players[this.data.myIndex]

    const currentPlayerIndex = state.currentPlayerIndex
    const isMyTurn = currentPlayerIndex === this.data.myIndex && 
                     state.stage < GAME_STAGE.SHOWDOWN

    // 计算跟注金额
    const toCall = state.currentBet - myPlayer.currentBet
    const canCheck = toCall === 0

    // 设置下注范围
    const minBet = state.minRaise
    const maxBet = myPlayer.chips

    // 调试信息
    console.log('游戏状态更新:', {
      stage: state.stage,
      stageText: STAGE_TEXTS[state.stage],
      pot: state.pot,
      communityCards: state.communityCards,
      myHand: myPlayer.hand,
      myHandLength: myPlayer.hand ? myPlayer.hand.length : 0
    })

    this.setData({
      gameStage: state.stage,
      stageText: STAGE_TEXTS[state.stage],
      pot: state.pot,
      communityCards: state.communityCards || [],
      players: state.players,
      myHand: myPlayer.hand || [],
      myChips: myPlayer.chips,
      myCurrentBet: myPlayer.currentBet,
      isMyTurn,
      canCheck,
      toCall,
      minBet,
      maxBet,
      betAmount: Math.min(minBet * 2, maxBet)
    })

    // 如果是我的回合且游戏刚开始，自动开始
    if (isMyTurn && state.stage === GAME_STAGE.PREFLOP && state.currentBet === state.blinds.big) {
      // 等待玩家操作
    }

    // 检查游戏是否结束
    if (state.stage === GAME_STAGE.FINISHED && state.winner) {
      this.showResult(state.winner)
    }

    // 如果是机器人回合，自动操作
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

    // 简单的 AI 逻辑
    let action = ACTION.CHECK
    let amount = 0

    const random = Math.random()

    if (toCall > 0) {
      // 需要跟注
      if (random < 0.1) {
        action = ACTION.FOLD
      } else if (random < 0.7) {
        action = ACTION.CALL
      } else {
        action = ACTION.RAISE
        amount = Math.min(toCall * 2, botPlayer.chips)
      }
    } else {
      // 可以过牌
      if (random < 0.6) {
        action = ACTION.CHECK
      } else {
        action = ACTION.RAISE
        amount = Math.min(state.blinds.big * 2, botPlayer.chips)
      }
    }

    // 执行动作
    game.playerAction(botPlayer.id, action, amount)
    this.updateGameState()
  },

  // 玩家操作
  fold() {
    this.data.game.playerAction(
      wx.getStorageSync('userId'),
      ACTION.FOLD
    )
    this.updateGameState()
  },

  check() {
    this.data.game.playerAction(
      wx.getStorageSync('userId'),
      ACTION.CHECK
    )
    this.updateGameState()
  },

  call() {
    this.data.game.playerAction(
      wx.getStorageSync('userId'),
      ACTION.CALL
    )
    this.updateGameState()
  },

  raise() {
    const amount = this.data.betAmount
    this.data.game.playerAction(
      wx.getStorageSync('userId'),
      ACTION.RAISE,
      amount
    )
    this.updateGameState()
  },

  allIn() {
    this.data.game.playerAction(
      wx.getStorageSync('userId'),
      ACTION.ALL_IN
    )
    this.updateGameState()
  },

  onBetChange(e) {
    this.setData({
      betAmount: e.detail.value
    })
  },

  showResult(winner) {
    const isMyWin = winner.players.some(p => p.id === wx.getStorageSync('userId'))
    
    this.setData({
      showResult: true,
      winnerText: isMyWin ? '🎉 你赢了！' : '😔 你输了',
      winnerHand: winner.hand ? {
        typeName: HAND_NAMES[winner.hand.type]
      } : null,
      winAmount: isMyWin ? winner.amount : 0
    })

    // 更新金币
    if (isMyWin) {
      app.addCoins(winner.amount)
    }
  },

  nextGame() {
    // 扣除入场费
    const entryFee = 50
    const success = app.deductCoins(entryFee)
    
    if (!success) {
      wx.showToast({
        title: '金币不足',
        icon: 'none'
      })
      return
    }

    // 重置游戏
    const myId = wx.getStorageSync('userId')
    const game = new GameState(this.data.roomId, myId, { small: 10, big: 20 })

    // 重新添加玩家
    const myCoins = app.getCoins()
    game.addPlayer(new Player(myId, this.data.myName, myCoins, false))

    const botNames = ['机器人 Alpha', '机器人 Beta', '机器人 Gamma']
    for (let i = 0; i < 2; i++) {
      game.addPlayer(new Player('bot_' + i, botNames[i], 1000, true))
    }

    this.setData({
      game,
      showResult: false,
      winnerText: '',
      winnerHand: null,
      winAmount: 0
    })

    // 开始新游戏
    setTimeout(() => {
      game.startGame()
      this.updateGameState()
    }, 500)
  },

  exitGame() {
    wx.navigateBack()
  },

  getSuitClass(suit) {
    return suit === '♥' || suit === '♦' ? 'hearts' : 'spades'
  }
})
