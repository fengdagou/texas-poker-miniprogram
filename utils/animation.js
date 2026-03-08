/**
 * 动画管理器
 */

class AnimationManager {
  constructor(page) {
    this.page = page
    this.animations = []
  }

  /**
   * 发牌动画 - 从牌堆飞到玩家手牌位置
   */
  dealCardAnimation(cardIndex, callback) {
    const query = wx.createSelectorQuery().in(this.page)
    
    query.select('.deck').boundingClientRect()
    query.select(`.player-hand-${cardIndex}`).boundingClientRect()
    
    query.exec((res) => {
      if (!res[0] || !res[1]) {
        callback && callback()
        return
      }

      const deckRect = res[0]
      const handRect = res[1]

      // 创建临时卡牌元素
      const card = wx.createAnimation({
        duration: 500,
        timingFunction: 'ease-out'
      })

      // 初始位置（牌堆）
      card.translateX(deckRect.left).translateY(deckRect.top).step()
      
      // 飞到手牌位置
      card.translateX(handRect.left).translateY(handRect.top).step()

      this.page.setData({
        dealCardAnimation: card.export()
      })

      // 动画完成后回调
      setTimeout(() => {
        this.page.setData({
          dealCardAnimation: null
        })
        callback && callback()
      }, 500)
    })
  }

  /**
   * 发公共牌动画
   */
  dealCommunityCard(cardIndex, callback) {
    const query = wx.createSelectorQuery().in(this.page)
    
    query.select('.deck').boundingClientRect()
    query.select(`.community-card-${cardIndex}`).boundingClientRect()
    
    query.exec((res) => {
      if (!res[0] || !res[1]) {
        callback && callback()
        return
      }

      const deckRect = res[0]
      const cardRect = res[1]

      const animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'ease-out'
      })

      animation.translateX(deckRect.left).translateY(deckRect.top).step()
      animation.translateX(cardRect.left).translateY(cardRect.top).step()

      this.page.setData({
        communityCardAnimation: animation.export()
      })

      setTimeout(() => {
        this.page.setData({
          communityCardAnimation: null
        })
        callback && callback()
      }, 400)
    })
  }

  /**
   * 筹码动画
   */
  chipAnimation(fromX, fromY, toX, toY, amount, callback) {
    const animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'ease-in-out'
    })

    animation.translateX(fromX).translateY(fromY).step()
    animation.translateX(toX).translateY(toY).scale(0.5).step()

    this.page.setData({
      chipAnimation: animation.export(),
      chipAmount: amount
    })

    setTimeout(() => {
      this.page.setData({
        chipAnimation: null,
        chipAmount: 0
      })
      callback && callback()
    }, 600)
  }

  /**
   * 胜利庆祝动画
   */
  winAnimation(callback) {
    const animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease'
    })

    animation.scale(1.2).rotate(360).step()
    animation.scale(1).rotate(0).step()

    this.page.setData({
      winAnimation: animation.export()
    })

    setTimeout(() => {
      this.page.setData({
        winAnimation: null
      })
      callback && callback()
    }, 1000)
  }

  /**
   * 牌型展示动画
   */
  showHandAnimation(handType, callback) {
    const animation = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out'
    })

    animation.opacity(0).scale(0.5).step()
    animation.opacity(1).scale(1).step()

    this.page.setData({
      handTypeAnimation: animation.export(),
      handTypeText: handType
    })

    setTimeout(() => {
      this.page.setData({
        handTypeAnimation: null
      })
      callback && callback()
    }, 800)
  }

  /**
   * 页面切换动画
   */
  pageTransitionAnimation(direction, callback) {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-in-out'
    })

    if (direction === 'left') {
      animation.translateX('-100%').step()
    } else {
      animation.translateX('100%').step()
    }

    this.page.setData({
      pageTransition: animation.export()
    })

    setTimeout(() => {
      callback && callback()
    }, 300)
  }

  /**
   * 金币增加动画
   */
  coinIncreaseAnimation(amount, callback) {
    const animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease-out'
    })

    animation.translateY(-50).opacity(1).step()
    animation.translateY(-100).opacity(0).step()

    this.page.setData({
      coinAnimation: animation.export(),
      coinAmount: amount
    })

    setTimeout(() => {
      this.page.setData({
        coinAnimation: null,
        coinAmount: 0
      })
      callback && callback()
    }, 1000)
  }

  /**
   * 取消所有动画
   */
  cancelAll() {
    this.animations = []
  }
}

module.exports = AnimationManager
