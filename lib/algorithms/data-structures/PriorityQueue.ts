export interface PriorityQueueItem<T> {
  item: T
  priority: number
}

export class PriorityQueue<T> {
  private heap: PriorityQueueItem<T>[]

  constructor() {
    this.heap = []
  }

  private parent(index: number): number {
    return Math.floor((index - 1) / 2)
  }

  private leftChild(index: number): number {
    return 2 * index + 1
  }

  private rightChild(index: number): number {
    return 2 * index + 2
  }

  private swap(index1: number, index2: number): void {
    const temp = this.heap[index1]
    this.heap[index1] = this.heap[index2]
    this.heap[index2] = temp
  }

  private heapifyUp(index: number): void {
    while (index > 0 && this.heap[this.parent(index)].priority < this.heap[index].priority) {
      this.swap(index, this.parent(index))
      index = this.parent(index)
    }
  }

  private heapifyDown(index: number): void {
    const size = this.heap.length
    let largest = index
    const left = this.leftChild(index)
    const right = this.rightChild(index)

    if (left < size && this.heap[left].priority > this.heap[largest].priority) {
      largest = left
    }

    if (right < size && this.heap[right].priority > this.heap[largest].priority) {
      largest = right
    }

    if (largest !== index) {
      this.swap(index, largest)
      this.heapifyDown(largest)
    }
  }

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority })
    this.heapifyUp(this.heap.length - 1)
  }

  dequeue(): T | null {
    if (this.heap.length === 0) {
      return null
    }

    if (this.heap.length === 1) {
      return this.heap.pop()!.item
    }

    const root = this.heap[0].item
    this.heap[0] = this.heap.pop()!
    this.heapifyDown(0)

    return root
  }

  peek(): T | null {
    return this.heap.length > 0 ? this.heap[0].item : null
  }

  isEmpty(): boolean {
    return this.heap.length === 0
  }

  size(): number {
    return this.heap.length
  }
}
