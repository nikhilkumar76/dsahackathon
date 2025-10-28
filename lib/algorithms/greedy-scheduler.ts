import { Types } from 'mongoose'
import { PriorityQueue } from './data-structures/PriorityQueue'
import { Task } from './data-structures/ConstraintGraph'
import { ITeacher } from '../models/Teacher'
import { IClassroom } from '../models/Classroom'
import { IBatch } from '../models/Batch'

export interface Assignment {
  day: number
  period: number
  teacherId: string
  subjectId: string
  classroomId: string
  batchId: string
}

export interface GreedyScheduleResult {
  schedule: Assignment[]
  unassigned: Task[]
}

interface SlotUsage {
  teachers: Set<string>
  classrooms: Set<string>
  batches: Set<string>
}

function slotToIndex(day: number, period: number): number {
  return (day - 1) * 6 + (period - 1)
}

function indexToSlot(index: number): { day: number; period: number } {
  const day = Math.floor(index / 6) + 1
  const period = (index % 6) + 1
  return { day, period }
}

function isSlotUnavailable(
  unavailableSlots: { day: number; period: number }[],
  day: number,
  period: number
): boolean {
  return unavailableSlots.some((slot) => slot.day === day && slot.period === period)
}

function isSlotPreferred(
  preferredSlots: { day: number; period: number }[],
  day: number,
  period: number
): boolean {
  return preferredSlots.some((slot) => slot.day === day && slot.period === period)
}

export function allocate(
  priorityQueue: PriorityQueue<Task>,
  validityMatrix: Map<string, boolean[]>,
  teachers: ITeacher[],
  classrooms: IClassroom[],
  batches: IBatch[]
): GreedyScheduleResult {
  const schedule: Assignment[] = []
  const unassigned: Task[] = []

  // Track slot usage: which resources are used in which slots
  const slotUsage: SlotUsage[] = Array.from({ length: 36 }, () => ({
    teachers: new Set<string>(),
    classrooms: new Set<string>(),
    batches: new Set<string>(),
  }))

  // Track teacher daily load
  const teacherDailyLoad = new Map<string, number[]>() // teacherId -> [load for each day 1-6]
  for (const teacher of teachers) {
    teacherDailyLoad.set(teacher._id.toString(), [0, 0, 0, 0, 0, 0])
  }

  // Track batch schedule for gap detection
  const batchSchedule = new Map<string, Set<number>>() // batchId -> set of slot indices
  for (const batch of batches) {
    batchSchedule.set(batch._id.toString(), new Set())
  }

  // Track remaining periods needed for each task
  const taskRemainingPeriods = new Map<string, number>()

  // Process each task from priority queue
  while (!priorityQueue.isEmpty()) {
    const task = priorityQueue.dequeue()!
    let periodsAssigned = 0
    const periodsNeeded = task.periodsNeeded

    // Get qualified teachers and suitable classrooms
    const qualifiedTeachers = teachers.filter((t) =>
      t.subjects.some((s) => s.toString() === task.subjectId)
    )

    const batch = batches.find((b) => b._id.toString() === task.batchId)
    if (!batch) continue

    const suitableClassrooms = classrooms.filter((c) => c.capacity >= batch.studentCount)

    // Try to assign required periods
    const validity = validityMatrix.get(task.id)!

    // Score all slots and sort by score
    const slotScores: Array<{ slotIndex: number; score: number }> = []

    for (let slotIndex = 0; slotIndex < 36; slotIndex++) {
      if (!validity[slotIndex]) continue

      const { day, period } = indexToSlot(slotIndex)

      // Check if slot is available (not already used by batch)
      if (slotUsage[slotIndex].batches.has(task.batchId)) {
        continue
      }

      // Find available teacher
      const availableTeacher = qualifiedTeachers.find((t) => {
        const teacherId = t._id.toString()
        if (slotUsage[slotIndex].teachers.has(teacherId)) return false
        if (isSlotUnavailable(t.unavailableSlots, day, period)) return false

        // Check daily limit
        const dailyLoad = teacherDailyLoad.get(teacherId)![day - 1]
        if (dailyLoad >= t.maxPeriodsPerDay) return false

        return true
      })

      if (!availableTeacher) continue

      // Find available classroom
      const availableClassroom = suitableClassrooms.find((c) => {
        const classroomId = c._id.toString()
        if (slotUsage[slotIndex].classrooms.has(classroomId)) return false
        if (isSlotUnavailable(c.unavailableSlots, day, period)) return false
        return true
      })

      if (!availableClassroom) continue

      // Calculate slot score using heuristics
      let score = 0

      // Balance heuristic: prefer days with lower teacher load
      const teacherId = availableTeacher._id.toString()
      const dailyLoad = teacherDailyLoad.get(teacherId)![day - 1]
      const avgDailyLoad =
        teacherDailyLoad.get(teacherId)!.reduce((a, b) => a + b, 0) / 6
      const balanceScore = avgDailyLoad - dailyLoad
      score += balanceScore * 10

      // Preference heuristic: bonus for preferred slots
      if (isSlotPreferred(availableTeacher.preferredSlots, day, period)) {
        score += 10
      }

      // Gap penalty: penalize slots that would create gaps in batch schedule
      const batchSlots = batchSchedule.get(task.batchId)!
      if (batchSlots.size > 0) {
        const daySlots = Array.from(batchSlots).filter((idx) => {
          const slotDay = Math.floor(idx / 6) + 1
          return slotDay === day
        })

        if (daySlots.length > 0) {
          const minDaySlot = Math.min(...daySlots)
          const maxDaySlot = Math.max(...daySlots)

          // If this slot would create a gap
          if (slotIndex < minDaySlot - 1 || slotIndex > maxDaySlot + 1) {
            score -= 20
          }
        }
      }

      // Classroom type match bonus
      if (availableClassroom.type === 'lab' && task.subjectId.includes('LAB')) {
        score += 5
      }

      slotScores.push({ slotIndex, score })
    }

    // Sort by score descending
    slotScores.sort((a, b) => b.score - a.score)

    // Assign to best available slots
    for (const { slotIndex } of slotScores) {
      if (periodsAssigned >= periodsNeeded) break

      const { day, period } = indexToSlot(slotIndex)

      // Re-check availability and find teacher/classroom
      if (slotUsage[slotIndex].batches.has(task.batchId)) continue

      const availableTeacher = qualifiedTeachers.find((t) => {
        const teacherId = t._id.toString()
        if (slotUsage[slotIndex].teachers.has(teacherId)) return false
        if (isSlotUnavailable(t.unavailableSlots, day, period)) return false
        const dailyLoad = teacherDailyLoad.get(teacherId)![day - 1]
        if (dailyLoad >= t.maxPeriodsPerDay) return false
        return true
      })

      if (!availableTeacher) continue

      const availableClassroom = suitableClassrooms.find((c) => {
        const classroomId = c._id.toString()
        if (slotUsage[slotIndex].classrooms.has(classroomId)) return false
        if (isSlotUnavailable(c.unavailableSlots, day, period)) return false
        return true
      })

      if (!availableClassroom) continue

      // Make assignment
      const assignment: Assignment = {
        day,
        period,
        teacherId: availableTeacher._id.toString(),
        subjectId: task.subjectId,
        classroomId: availableClassroom._id.toString(),
        batchId: task.batchId,
      }

      schedule.push(assignment)

      // Update slot usage
      slotUsage[slotIndex].teachers.add(availableTeacher._id.toString())
      slotUsage[slotIndex].classrooms.add(availableClassroom._id.toString())
      slotUsage[slotIndex].batches.add(task.batchId)

      // Update teacher daily load
      const teacherLoad = teacherDailyLoad.get(availableTeacher._id.toString())!
      teacherLoad[day - 1]++

      // Update batch schedule
      batchSchedule.get(task.batchId)!.add(slotIndex)

      periodsAssigned++

      // Update validity matrix for constraint propagation
      validity[slotIndex] = false
    }

    // If not all periods assigned, mark as unassigned
    if (periodsAssigned < periodsNeeded) {
      taskRemainingPeriods.set(task.id, periodsNeeded - periodsAssigned)
      unassigned.push({
        ...task,
        periodsNeeded: periodsNeeded - periodsAssigned,
      })
    }
  }

  return {
    schedule,
    unassigned,
  }
}
