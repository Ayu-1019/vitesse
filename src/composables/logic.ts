import type { Ref } from 'vue'
import type { BlockState, GameState } from '../types'

// 记录当前点周围地雷数
const directions = [
  [0, 1],
  [0, -1],
  [1, 0],
  [1, 1],
  [1, -1],
  [-1, 0],
  [-1, 1],
  [-1, -1],
]

export class GamePlay {
  state = ref() as Ref<GameState>

  constructor(
    public width: number,
    public height: number,
    public minesNumber: number,
  ) {
    this.reset()
  }

  get board() {
    return this.state.value.board
  }

  get blocks() {
    return this.state.value.board.flat()
  }

  // 重置
  reset(
    width = this.width,
    height = this.height,
    minesNumber = this.minesNumber,
  ) {
    this.width = width
    this.height = height
    this.minesNumber = minesNumber

    this.state.value = {
      mineGenerated: false,
      gameState: 'play',
      board: Array.from({ length: this.height }, (_, y) =>
        Array.from({ length: this.width }, (_, x): BlockState => ({
          x,
          y,
          revealed: false,
          adjacentMines: 0,
        })),
      ),
    }
  }

  // 检查游戏状态
  checkGameState() {
    if (!this.state.value.mineGenerated || this.state.value.gameState !== 'play')
      return
    const blocks = this.board.flat()

    // 获胜条件 所有地雷格子都被标记
    if (!blocks.some((block: BlockState) => block.mine && !block.flagged)) {
      this.state.value.gameState = 'win'
      // 获胜后 翻开所有格子
      this.board.flat().forEach((item) => {
        if (!item.mine)
          item.revealed = true
      })
      alert('win')
    }
  }

  randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  randomInt(min: number, max: number): number {
    return Math.round(this.randomRange(min, max))
  }

  // 生成地雷
  generateMines(state: BlockState[][], initial: BlockState) {
    const placeRandom = () => {
      const x = this.randomInt(0, this.width - 1)
      const y = this.randomInt(0, this.height - 1)
      const block = state[y][x]
      if (Math.abs(initial.x - block.x) <= 1 && Math.abs(initial.y - block.y) <= 1)
        return false
      if (block.mine)
        return false
      block.mine = true
      return true
    }
    Array.from({ length: this.minesNumber }, () => null)
      .forEach(() => {
        let placed = false
        while (!placed)
          placed = placeRandom()
      })
    this.updateNumbers()
  }

  // 格子周围的地雷数
  updateNumbers() {
    this.board.forEach((row) => {
      row.forEach((block: BlockState) => {
        if (block.mine)
          return

        this.getSiblings(block).forEach((item) => {
          if (item.mine)
            block.adjacentMines += 1
        })
      })
    })
  }

  // 获取点击格子周围的格子
  getSiblings(block: BlockState) {
    return directions.map(([dx, dy]) => {
      const x2 = block.x + dx
      const y2 = block.y + dy
      if (x2 < 0 || x2 >= this.height || y2 < 0 || y2 >= this.width)
        return undefined
      return this.board[y2][x2]
    })
      .filter(Boolean) as BlockState[]
  }

  // 点击
  onClick(block: BlockState) {
    if (this.state.value.gameState !== 'play')
      return

    // 标记过 点击不会炸
    if (block.flagged)
      return

    if (!this.state.value.mineGenerated) {
      this.generateMines(this.board, block)
      this.state.value.mineGenerated = true
    }

    block.revealed = true
    if (block.mine) {
      this.showAllMines()
      this.state.value.gameState = 'lost'
      alert('lost')
    }
    this.expendZero(block)
  }

  // 右键点击
  onRightClick(block: BlockState) {
    if (this.state.value.gameState !== 'play')
      return

    // 没有翻开 才能标记
    block.flagged = !block.flagged
  }

  // 移动端长按
  getTouch(block: BlockState) {
    // 这里设置定时器，定义长按500毫秒触发长按事件
    setTimeout(() => {
      if (block.revealed)
        return
      block.flagged = !block.flagged
    }, 500)
    return false
  }

  // 点到雷 炸了 显示全部雷
  showAllMines() {
    this.board.flat().forEach((item) => {
      if (item.mine)
        item.revealed = true
    })
  }

  // 展开
  expendZero(block: BlockState) {
    if (block.adjacentMines)
      return
    this.getSiblings(block).forEach((s) => {
      if (!s.revealed) {
        if (!s.flagged)
          s.revealed = true
        this.expendZero(s)
      }
    })
  }
}
