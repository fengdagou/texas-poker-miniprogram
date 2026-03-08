/**
 * AI 玩家 - 支持不同难度
 */

const { HAND_TYPES } = require('./poker.js')

// AI 难度配置
const AI_DIFFICULTY = {
  EASY: 'easy',       // 简单 - 随机决策
  NORMAL: 'normal',   // 普通 - 基础策略
  HARD: 'hard',       // 困难 - 高级策略
  EXPERT: 'expert'    // 专家 - 蒙特卡洛模拟
}

// 难度配置参数
const DIFFICULTY_CONFIG = {
  easy: {
    randomRate: 0.7,      // 随机决策概率
    bluffRate: 0.1,       // 诈唬概率
    callRate: 0.6,        // 跟注意愿
    raiseRate: 0.2        // 加注倾向
  },
  normal: {
    randomRate: 0.4,
    bluffRate: 0.2,
    callRate: 0.5,
    raiseRate: 0.3
  },
  hard: {
    randomRate: 0.15,
    bluffRate: 0.3,
    callRate: 0.4,
    raiseRate: 0.4
  },
  expert: {
    randomRate: 0.05,
    bluffRate: 0.4,
    callRate: 0.35,
    raiseRate: 0.5
  }
}

class AIPlayer {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty
    this.config = DIFFICULTY_CONFIG[difficulty]
    this.handStrength = 0
    this.position = 0
    this.opponentCount = 1
  }

  /**
   * 设置 AI 状态
   */
  setState(handStrength, position, opponentCount) {
    this.handStrength = handStrength  // 手牌强度 0-1
    this.position = position          // 位置 0-1（越晚越好）
    this.opponentCount = opponentCount // 对手数量
  }

  /**
   * AI 决策
   */
  decide(gameState) {
    const config = this.config
    
    // 简单难度：大部分随机
    if (Math.random() < config.randomRate) {
      return this.randomDecision(gameState)
    }

    // 计算期望值
    const ev = this.calculateEV(gameState)
    
    // 根据期望值和难度做决策
    return this.strategicDecision(ev, gameState)
  }

  /**
   * 随机决策（简单难度）
   */
  randomDecision(gameState) {
    const rand = Math.random()
    
    if (rand < 0.3) {
      return { action: 'fold' }
    } else if (rand < 0.7) {
      return { action: 'check' }
    } else {
      return { 
        action: 'raise',
        amount: gameState.bigBlind * 2
      }
    }
  }

  /**
   * 策略决策（中高难度）
   */
  strategicDecision(ev, gameState) {
    const config = this.config
    const { currentBet, playerChips, potSize } = gameState

    // 手牌很强
    if (this.handStrength > 0.7) {
      if (Math.random() < config.raiseRate) {
        return {
          action: 'raise',
          amount: Math.min(currentBet * 3, playerChips)
        }
      }
      return { action: 'call' }
    }

    // 手牌中等
    if (this.handStrength > 0.4) {
      if (currentBet === 0) {
        return { action: 'check' }
      }
      
      // 计算底池赔率
      const potOdds = currentBet / (potSize + currentBet)
      
      if (this.handStrength > potOdds) {
        return { action: 'call' }
      } else {
        // 诈唬
        if (Math.random() < config.bluffRate) {
          return {
            action: 'raise',
            amount: currentBet * 2
          }
        }
        return { action: 'fold' }
      }
    }

    // 手牌很弱
    if (currentBet === 0) {
      // 免费看牌
      if (Math.random() < config.bluffRate) {
        return {
          action: 'raise',
          amount: gameState.bigBlind * 2
        }
      }
      return { action: 'check' }
    }

    // 跟注还是弃牌
    if (Math.random() < config.callRate) {
      return { action: 'call' }
    }
    return { action: 'fold' }
  }

  /**
   * 计算期望值（简化版）
   */
  calculateEV(gameState) {
    const { potSize, currentBet, playerChips } = gameState
    
    // 胜率估算
    const winRate = this.handStrength * 0.8 + Math.random() * 0.2
    
    // 期望值 = 胜率 * 收益 - (1-胜率) * 成本
    const ev = winRate * potSize - (1 - winRate) * currentBet
    
    return ev / (potSize + currentBet)  // 归一化
  }

  /**
   * 专家难度：蒙特卡洛模拟
   */
  monteCarloDecision(gameState, simulations = 1000) {
    let wins = 0
    
    for (let i = 0; i < simulations; i++) {
      // 模拟剩余牌局
      const result = this.simulateGame(gameState)
      if (result.win) {
        wins++
      }
    }

    const winRate = wins / simulations
    this.handStrength = winRate

    return this.strategicDecision(winRate, gameState)
  }

  /**
   * 模拟牌局（简化）
   */
  simulateGame(gameState) {
    // 随机生成对手牌和公共牌
    // 返回是否获胜
    return {
      win: Math.random() < this.handStrength
    }
  }
}

/**
 * 创建 AI 玩家
 */
function createAIPlayer(difficulty) {
  return new AIPlayer(difficulty)
}

module.exports = {
  AIPlayer,
  createAIPlayer,
  AI_DIFFICULTY,
  DIFFICULTY_CONFIG
}
