/**
 * 游戏逻辑核心
 */

const { Deck, HandEvaluator, HAND_TYPES } = require('./poker.js')

// 游戏阶段
const GAME_STAGE = {
  WAITING: 0,      // 等待开始
  PREFLOP: 1,      // 翻牌前
  FLOP: 2,         // 翻牌
  TURN: 3,         // 转牌
  RIVER: 4,        // 河牌
  SHOWDOWN: 5,     // 摊牌
  FINISHED: 6      // 结束
}

// 玩家动作
const ACTION = {
  FOLD: 'fold',     // 弃牌
  CHECK: 'check',   // 过牌
  CALL: 'call',     // 跟注
  RAISE: 'raise',   // 加注
  ALL_IN: 'allin'   // 全下
}

class Player {
  constructor(id, name, chips, isBot = false) {
    this.id = id
    this.name = name
    this.chips = chips
    this.hand = []
    this.currentBet = 0
    this.isFolded = false
    this.isAllIn = false
    this.isBot = isBot
    this.lastAction = null
  }

  toJSON(revealHand = false) {
    return {
      id: this.id,
      name: this.name,
      chips: this.chips,
      currentBet: this.currentBet,
      isFolded: this.isFolded,
      isAllIn: this.isAllIn,
      isBot: this.isBot,
      lastAction: this.lastAction,
      // 只在摊牌时或玩家自己时暴露手牌
      hand: revealHand ? this.hand.map(c => c.toJSON()) : []
    }
  }
}

class GameState {
  constructor(roomId, hostId, blinds = { small: 10, big: 20 }) {
    this.roomId = roomId
    this.hostId = hostId
    this.blinds = blinds
    this.players = []
    this.dealerIndex = 0
    this.currentPlayerIndex = 0
    this.pot = 0
    this.communityCards = []
    this.stage = GAME_STAGE.WAITING
    this.currentBet = 0
    this.minRaise = blinds.big
    this.deck = null
    this.winner = null
    this.handHistory = []
  }

  addPlayer(player) {
    if (this.players.length >= 6) {
      return { success: false, message: '房间已满' }
    }
    this.players.push(player)
    return { success: true }
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId)
    if (index !== -1) {
      this.players.splice(index, 1)
      if (this.dealerIndex >= this.players.length) {
        this.dealerIndex = 0
      }
    }
  }

  startGame() {
    if (this.players.length < 2) {
      return { success: false, message: '至少需要 2 名玩家' }
    }

    this.deck = new Deck()
    this.pot = 0
    this.communityCards = []
    this.currentBet = this.blinds.big
    this.minRaise = this.blinds.big
    this.winner = null
    this.stage = GAME_STAGE.PREFLOP

    // 重置玩家状态
    for (let player of this.players) {
      player.hand = []
      player.currentBet = 0
      player.isFolded = false
      player.isAllIn = player.chips === 0
      player.lastAction = null
    }

    // 移动庄家位置
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length

    // 发手牌（所有玩家都发牌，包括 All-in 的玩家）
    for (let i = 0; i < 2; i++) {
      for (let player of this.players) {
        player.hand.push(this.deck.deal())
      }
    }

    // 盲注
    const sbIndex = (this.dealerIndex + 1) % this.players.length
    const bbIndex = (this.dealerIndex + 2) % this.players.length

    this.postBlind(sbIndex, this.blinds.small, 'small blind')
    this.postBlind(bbIndex, this.blinds.big, 'big blind')

    // 设置当前玩家（大盲注左边）
    this.currentPlayerIndex = (bbIndex + 1) % this.players.length

    return { success: true }
  }

  postBlind(playerIndex, amount, type) {
    const player = this.players[playerIndex]
    if (!player || player.isAllIn) return

    const actualAmount = Math.min(amount, player.chips)
    player.chips -= actualAmount
    player.currentBet = actualAmount
    this.pot += actualAmount

    if (player.chips === 0) {
      player.isAllIn = true
    }

    player.lastAction = `${type}: ${actualAmount}`
  }

  playerAction(playerId, action, amount = 0) {
    const playerIndex = this.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1 || playerIndex !== this.currentPlayerIndex) {
      return { success: false, message: '不是你的回合' }
    }

    const player = this.players[playerIndex]
    if (player.isFolded || player.isAllIn) {
      return { success: false, message: '无法操作' }
    }

    let result

    switch (action) {
      case ACTION.FOLD:
        result = this.handleFold(player)
        break
      case ACTION.CHECK:
        result = this.handleCheck(player)
        break
      case ACTION.CALL:
        result = this.handleCall(player)
        break
      case ACTION.RAISE:
        result = this.handleRaise(player, amount)
        break
      case ACTION.ALL_IN:
        result = this.handleAllIn(player)
        break
      default:
        result = { success: false, message: '无效动作' }
    }

    if (result.success) {
      this.nextPlayer()
    }

    return result
  }

  handleFold(player) {
    player.isFolded = true
    player.lastAction = '弃牌'
    return { success: true, action: ACTION.FOLD }
  }

  handleCheck(player) {
    if (this.currentBet > player.currentBet) {
      return { success: false, message: '不能过牌，需要跟注' }
    }
    player.lastAction = '过牌'
    return { success: true, action: ACTION.CHECK }
  }

  handleCall(player) {
    const toCall = this.currentBet - player.currentBet
    if (toCall === 0) {
      return this.handleCheck(player)
    }

    const actualAmount = Math.min(toCall, player.chips)
    player.chips -= actualAmount
    player.currentBet += actualAmount
    this.pot += actualAmount

    if (player.chips === 0) {
      player.isAllIn = true
    }

    player.lastAction = `跟注 ${actualAmount}`
    return { success: true, action: ACTION.CALL, amount: actualAmount }
  }

  handleRaise(player, amount) {
    const toCall = this.currentBet - player.currentBet
    const totalBet = toCall + amount

    if (totalBet > player.chips) {
      return this.handleAllIn(player)
    }

    if (amount < this.minRaise) {
      return { success: false, message: `最小加注额为 ${this.minRaise}` }
    }

    player.chips -= totalBet
    this.pot += totalBet
    player.currentBet += totalBet
    this.currentBet = player.currentBet
    this.minRaise = amount

    player.lastAction = `加注 ${amount}`
    return { success: true, action: ACTION.RAISE, amount }
  }

  handleAllIn(player) {
    const allInAmount = player.chips
    player.chips = 0
    player.currentBet += allInAmount
    this.pot += allInAmount
    player.isAllIn = true
    player.lastAction = `全下 ${allInAmount}`

    console.log(`[handleAllIn] ${player.name} 全下，更新前 currentBet=${this.currentBet}, player.currentBet=${player.currentBet}`)

    if (player.currentBet > this.currentBet) {
      this.currentBet = player.currentBet
      this.minRaise = allInAmount
    }

    console.log(`[handleAllIn] 更新后 currentBet=${this.currentBet}`)

    return { success: true, action: ACTION.ALL_IN, amount: allInAmount }
  }

  nextPlayer() {
    const currentPlayer = this.players[this.currentPlayerIndex]
    console.log('[nextPlayer] 开始，currentPlayerIndex=' + this.currentPlayerIndex + ', 当前玩家=' + (currentPlayer ? currentPlayer.name : 'null'))
    
    // 检查是否只剩一个玩家（其他人都弃牌）
    const notFoldedPlayers = this.players.filter(p => !p.isFolded)
    console.log('[nextPlayer] notFoldedPlayers=' + notFoldedPlayers.length)
    
    if (notFoldedPlayers.length === 1) {
      console.log('[nextPlayer] 只剩一个玩家，获胜')
      this.handleWinner(notFoldedPlayers[0])
      return
    }
    
    // 检查是否所有未弃牌的玩家都 ALL IN 了
    const allInOrFolded = this.players.every(p => p.isFolded || p.isAllIn)
    console.log('[nextPlayer] allInOrFolded=' + allInOrFolded)
    
    if (allInOrFolded) {
      console.log('[nextPlayer] 所有玩家都 ALL IN，继续发公共牌')
      this.nextStage()
      return
    }

    // 检查是否一轮结束
    const allCalled = this.players.every(p => 
      p.isFolded || p.isAllIn || p.currentBet === this.currentBet
    )
    console.log('[nextPlayer] allCalled=' + allCalled + ', currentBet=' + this.currentBet)
    console.log('[nextPlayer] 玩家下注:', this.players.map(p => p.name + ':' + p.currentBet + '(allIn=' + p.isAllIn + ')').join(', '))

    if (allCalled) {
      console.log('[nextPlayer] 一轮结束，进入下一阶段')
      this.nextStage()
    } else {
      // 下一个玩家
      console.log('[nextPlayer] 寻找下一个玩家...')
      do {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
        const nextPlayer = this.players[this.currentPlayerIndex]
        console.log('[nextPlayer] 检查索引=' + this.currentPlayerIndex + ', 玩家=' + (nextPlayer ? nextPlayer.name : 'null') + ', isFolded=' + (nextPlayer ? nextPlayer.isFolded : 'null') + ', isAllIn=' + (nextPlayer ? nextPlayer.isAllIn : 'null'))
      } while (
        this.players[this.currentPlayerIndex].isFolded || 
        this.players[this.currentPlayerIndex].isAllIn
      )
      const finalPlayer = this.players[this.currentPlayerIndex]
      console.log('[nextPlayer] 找到下一个玩家：' + (finalPlayer ? finalPlayer.name : 'null'))
    }
  }

  nextStage() {
    // 重置当前下注
    for (let player of this.players) {
      player.currentBet = 0
    }
    this.currentBet = 0
    this.minRaise = this.blinds.big

    // 找到第一个活跃玩家
    this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length
    while (
      this.players[this.currentPlayerIndex].isFolded || 
      this.players[this.currentPlayerIndex].isAllIn
    ) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
    }

    switch (this.stage) {
      case GAME_STAGE.PREFLOP:
        this.stage = GAME_STAGE.FLOP
        this.communityCards.push(...this.deck.dealCards(3))
        break
      case GAME_STAGE.FLOP:
        this.stage = GAME_STAGE.TURN
        this.communityCards.push(...this.deck.dealCards(1))
        break
      case GAME_STAGE.TURN:
        this.stage = GAME_STAGE.RIVER
        this.communityCards.push(...this.deck.dealCards(1))
        break
      case GAME_STAGE.RIVER:
        this.stage = GAME_STAGE.SHOWDOWN
        this.goToShowdown()
        break
    }
  }

  goToShowdown() {
    this.stage = GAME_STAGE.SHOWDOWN
    this.determineWinner()
  }

  determineWinner() {
    const activePlayers = this.players.filter(p => !p.isFolded)
    
    if (activePlayers.length === 1) {
      this.handleWinner(activePlayers[0])
      return
    }

    // 评估每个玩家的牌型
    let bestHand = null
    let bestScore = -1
    let winners = []

    for (let player of activePlayers) {
      const hand = HandEvaluator.evaluate(player.hand, this.communityCards)
      const score = HandEvaluator.calculateScore(hand)

      if (score > bestScore) {
        bestScore = score
        bestHand = hand
        winners = [player]
      } else if (score === bestScore) {
        winners.push(player)
      }
    }

    // 分配彩池
    const winAmount = Math.floor(this.pot / winners.length)
    for (let winner of winners) {
      winner.chips += winAmount
    }

    this.winner = {
      players: winners,
      hand: bestHand,
      amount: winAmount
    }

    this.stage = GAME_STAGE.FINISHED
  }

  handleWinner(winner) {
    winner.chips += this.pot
    this.winner = {
      players: [winner],
      hand: null,
      amount: this.pot
    }
    this.stage = GAME_STAGE.FINISHED
  }

  getState(currentViewPlayerId = null) {
    return {
      roomId: this.roomId,
      stage: this.stage,
      pot: this.pot,
      communityCards: this.communityCards.map(c => c.toJSON()),
      currentBet: this.currentBet,
      currentPlayerIndex: this.currentPlayerIndex,
      dealerIndex: this.dealerIndex,
      players: this.players.map(p => {
        // 每个玩家只能看到自己的手牌
        const revealHand = currentViewPlayerId ? (p.id === currentViewPlayerId || this.stage >= GAME_STAGE.SHOWDOWN) : false
        return p.toJSON(revealHand)
      }),
      winner: this.winner ? {
        players: this.winner.players.map(p => ({ id: p.id, name: p.name })),
        hand: this.winner.hand,
        amount: this.winner.amount
      } : null,
      blinds: this.blinds
    }
  }
}

module.exports = {
  GameState,
  Player,
  GAME_STAGE,
  ACTION
}
