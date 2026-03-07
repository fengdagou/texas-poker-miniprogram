/**
 * 扑克牌工具类
 */

// 花色
const SUITS = ['♠', '♥', '♦', '♣']
const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs']

// 牌面
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
}

// 牌型
const HAND_TYPES = {
  HIGH_CARD: 0,        // 高牌
  ONE_PAIR: 1,         // 一对
  TWO_PAIR: 2,         // 两对
  THREE_OF_A_KIND: 3,  // 三条
  STRAIGHT: 4,         // 顺子
  FLUSH: 5,            // 同花
  FULL_HOUSE: 6,       // 葫芦
  FOUR_OF_A_KIND: 7,   // 四条
  STRAIGHT_FLUSH: 8,   // 同花顺
  ROYAL_FLUSH: 9       // 皇家同花顺
}

const HAND_NAMES = {
  0: '高牌',
  1: '一对',
  2: '两对',
  3: '三条',
  4: '顺子',
  5: '同花',
  6: '葫芦',
  7: '四条',
  8: '同花顺',
  9: '皇家同花顺'
}

class Card {
  constructor(rank, suit) {
    this.rank = rank
    this.suit = suit
    this.value = RANK_VALUES[rank]
  }

  toString() {
    return `${this.rank}${this.suit}`
  }

  toJSON() {
    return {
      rank: this.rank,
      suit: this.suit,
      value: this.value
    }
  }
}

class Deck {
  constructor() {
    this.cards = []
    this.reset()
  }

  reset() {
    this.cards = []
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        this.cards.push(new Card(rank, suit))
      }
    }
    this.shuffle()
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  deal() {
    return this.cards.pop()
  }

  dealCards(count) {
    const cards = []
    for (let i = 0; i < count; i++) {
      cards.push(this.deal())
    }
    return cards
  }

  remaining() {
    return this.cards.length
  }
}

/**
 * 牌型评估器
 */
class HandEvaluator {
  /**
   * 评估最好的牌型
   * @param {Card[]} holeCards - 手牌 (2 张)
   * @param {Card[]} communityCards - 公共牌 (5 张)
   * @returns {Object} 牌型信息
   */
  static evaluate(holeCards, communityCards) {
    const allCards = [...holeCards, ...communityCards]
    
    // 所有 5 张牌的组合
    const combinations = this.getCombinations(allCards, 5)
    
    let bestHand = null
    let bestScore = -1

    for (let combo of combinations) {
      const hand = this.evaluateFiveCards(combo)
      const score = this.calculateScore(hand)
      
      if (score > bestScore) {
        bestScore = score
        bestHand = hand
      }
    }

    return bestHand
  }

  /**
   * 评估 5 张牌的牌型
   */
  static evaluateFiveCards(cards) {
    // 按牌值排序
    cards.sort((a, b) => b.value - a.value)

    const isFlush = cards.every(c => c.suit === cards[0].suit)
    
    // 检查顺子
    let isStraight = true
    for (let i = 0; i < cards.length - 1; i++) {
      if (cards[i].value - cards[i + 1].value !== 1) {
        // 特殊情况：A-2-3-4-5
        if (i === 0 && cards[0].value === 14 && 
            cards[1].value === 5 && cards[2].value === 4 && 
            cards[3].value === 3 && cards[4].value === 2) {
          // A 当作 1
          isStraight = true
          break
        }
        isStraight = false
        break
      }
    }

    // 统计牌值出现次数
    const rankCount = {}
    for (let card of cards) {
      rankCount[card.value] = (rankCount[card.value] || 0) + 1
    }

    const counts = Object.values(rankCount).sort((a, b) => b - a)

    // 判断牌型
    let type = HAND_TYPES.HIGH_CARD

    if (isFlush && isStraight) {
      if (cards[0].value === 14 && cards[4].value === 10) {
        type = HAND_TYPES.ROYAL_FLUSH
      } else {
        type = HAND_TYPES.STRAIGHT_FLUSH
      }
    } else if (counts[0] === 4) {
      type = HAND_TYPES.FOUR_OF_A_KIND
    } else if (counts[0] === 3 && counts[1] === 2) {
      type = HAND_TYPES.FULL_HOUSE
    } else if (isFlush) {
      type = HAND_TYPES.FLUSH
    } else if (isStraight) {
      type = HAND_TYPES.STRAIGHT
    } else if (counts[0] === 3) {
      type = HAND_TYPES.THREE_OF_A_KIND
    } else if (counts[0] === 2 && counts[1] === 2) {
      type = HAND_TYPES.TWO_PAIR
    } else if (counts[0] === 2) {
      type = HAND_TYPES.ONE_PAIR
    }

    return {
      type,
      typeName: HAND_NAMES[type],
      cards,
      isFlush,
      isStraight
    }
  }

  /**
   * 计算牌型分数（用于比较）
   */
  static calculateScore(hand) {
    let score = hand.type * 1000000
    
    // 加上牌值
    for (let i = 0; i < hand.cards.length; i++) {
      score += hand.cards[i].value * Math.pow(15, 4 - i)
    }

    return score
  }

  /**
   * 获取所有 5 张牌的组合
   */
  static getCombinations(arr, k) {
    const result = []
    
    function backtrack(start, path) {
      if (path.length === k) {
        result.push([...path])
        return
      }
      
      for (let i = start; i < arr.length; i++) {
        path.push(arr[i])
        backtrack(i + 1, path)
        path.pop()
      }
    }
    
    backtrack(0, [])
    return result
  }
}

module.exports = {
  Card,
  Deck,
  HandEvaluator,
  HAND_TYPES,
  HAND_NAMES,
  SUITS,
  RANKS
}
