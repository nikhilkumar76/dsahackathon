import { Assignment } from './greedy-scheduler'
import { ITeacher } from '../models/Teacher'
import { IBatch } from '../models/Batch'

const MAX_OPTIMIZATION_ITERATIONS = 100

function slotToIndex(day: number, period: number): number {
  return (day - 1) * 6 + (period - 1)
}

function calculateTeacherLoadVariance(schedule: Assignment[], teachers: ITeacher[]): number {
  let totalVariance = 0

  for (const teacher of teachers) {
    const teacherId = teacher._id.toString()

    // Calculate daily loads
    const dailyLoads = [0, 0, 0, 0, 0, 0]
    for (const assignment of schedule) {
      if (assignment.teacherId === teacherId) {
        dailyLoads[assignment.day - 1]++
      }
    }

    // Calculate variance
    const mean = dailyLoads.reduce((a, b) => a + b, 0) / 6
    const variance = dailyLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / 6

    totalVariance += variance
  }

  return totalVariance
}

function calculateBatchGaps(schedule: Assignment[], batches: IBatch[]): number {
  let totalGaps = 0

  for (const batch of batches) {
    const batchId = batch._id.toString()

    // For each day, find gaps in batch schedule
    for (let day = 1; day <= 6; day++) {
      const dayAssignments = schedule
        .filter((a) => a.batchId === batchId && a.day === day)
        .map((a) => a.period)
        .sort((a, b) => a - b)

      if (dayAssignments.length <= 1) continue

      // Count gaps between first and last period
      const firstPeriod = dayAssignments[0]
      const lastPeriod = dayAssignments[dayAssignments.length - 1]
      const expectedPeriods = lastPeriod - firstPeriod + 1
      const actualPeriods = dayAssignments.length
      const gaps = expectedPeriods - actualPeriods

      totalGaps += gaps
    }
  }

  return totalGaps
}

function calculateQualityScore(
  schedule: Assignment[],
  teachers: ITeacher[],
  batches: IBatch[]
): number {
  const teacherVariance = calculateTeacherLoadVariance(schedule, teachers)
  const batchGaps = calculateBatchGaps(schedule, batches)

  // Lower is better
  return teacherVariance * 0.4 + batchGaps * 0.4
}

function canSwapAssignments(
  schedule: Assignment[],
  index1: number,
  index2: number
): boolean {
  const a1 = schedule[index1]
  const a2 = schedule[index2]

  // Can't swap if they're the same batch (would create conflict)
  if (a1.batchId === a2.batchId) return false

  // Can't swap if teacher/classroom conflicts
  const slot1Index = slotToIndex(a1.day, a1.period)
  const slot2Index = slotToIndex(a2.day, a2.period)

  // Check if swapping would create conflicts
  for (let i = 0; i < schedule.length; i++) {
    if (i === index1 || i === index2) continue

    const assignment = schedule[i]
    const slotIndex = slotToIndex(assignment.day, assignment.period)

    // If a2 moves to slot1, check conflicts
    if (slotIndex === slot1Index) {
      if (
        assignment.teacherId === a2.teacherId ||
        assignment.classroomId === a2.classroomId ||
        assignment.batchId === a2.batchId
      ) {
        return false
      }
    }

    // If a1 moves to slot2, check conflicts
    if (slotIndex === slot2Index) {
      if (
        assignment.teacherId === a1.teacherId ||
        assignment.classroomId === a1.classroomId ||
        assignment.batchId === a1.batchId
      ) {
        return false
      }
    }
  }

  return true
}

export function optimize(
  initialSchedule: Assignment[],
  teachers: ITeacher[],
  batches: IBatch[]
): Assignment[] {
  let schedule = [...initialSchedule]
  let currentScore = calculateQualityScore(schedule, teachers, batches)

  let improvements = 0

  for (let iteration = 0; iteration < MAX_OPTIMIZATION_ITERATIONS; iteration++) {
    // Try random swaps
    if (schedule.length < 2) break

    const index1 = Math.floor(Math.random() * schedule.length)
    const index2 = Math.floor(Math.random() * schedule.length)

    if (index1 === index2) continue

    // Check if swap is valid
    if (!canSwapAssignments(schedule, index1, index2)) continue

    // Try swap
    const newSchedule = [...schedule]
    const temp = newSchedule[index1]
    newSchedule[index1] = newSchedule[index2]
    newSchedule[index2] = temp

    const newScore = calculateQualityScore(newSchedule, teachers, batches)

    // Accept if improved
    if (newScore < currentScore) {
      schedule = newSchedule
      currentScore = newScore
      improvements++
    }
  }

  return schedule
}
