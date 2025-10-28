export interface Task {
  id: string
  batchId: string
  subjectId: string
  periodsNeeded: number
}

export class ConstraintGraph {
  private nodes: Map<string, Task>
  private edges: Map<string, Set<string>>

  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
  }

  addNode(task: Task): void {
    this.nodes.set(task.id, task)
    if (!this.edges.has(task.id)) {
      this.edges.set(task.id, new Set())
    }
  }

  addEdge(taskId1: string, taskId2: string): void {
    if (!this.edges.has(taskId1)) {
      this.edges.set(taskId1, new Set())
    }
    if (!this.edges.has(taskId2)) {
      this.edges.set(taskId2, new Set())
    }

    this.edges.get(taskId1)!.add(taskId2)
    this.edges.get(taskId2)!.add(taskId1)
  }

  getConflicts(taskId: string): Set<string> {
    return this.edges.get(taskId) || new Set()
  }

  getConstraintCount(taskId: string): number {
    return this.edges.get(taskId)?.size || 0
  }

  getTask(taskId: string): Task | undefined {
    return this.nodes.get(taskId)
  }

  getAllTasks(): Task[] {
    return Array.from(this.nodes.values())
  }

  getTaskIds(): string[] {
    return Array.from(this.nodes.keys())
  }
}
