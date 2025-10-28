import { Task } from './data-structures/ConstraintGraph'
import { Assignment } from './greedy-scheduler'
import { ITeacher } from '../models/Teacher'
import { IClassroom } from '../models/Classroom'
import { IBatch } from '../models/Batch'

const MAX_BACKTRACK_ITERATIONS = 10000

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

function buildSlotUsage(schedule: Assignment[]): SlotUsage[] {
  const slotUsage: SlotUsage[] = Array.from({ length: 36 }, () => ({
    teachers: new Set<string>(),
    classrooms: new Set<string>(),
    batches: new Set<string>(),
  }))

  for (const assignment of schedule) {
    const slotIndex = slotToIndex(assignment.day, assignment.period)
    slotUsage[slotIndex].teachers.add(assignment.teacherId)
    slotUsage[slotIndex].classrooms.add(assignment.classroomId)
    slotUsage[slotIndex].batches.add(assignment.batchId)
  }

  return slotUsage
}

export function resolve(
  initialSchedule: Assignment[],
  unassignedTasks: Task[],
  teachers: ITeacher[],
  classrooms: IClassroom[],
  batches: IBatch[]
): { schedule: Assignment[]; success: boolean; errors: string[] } {
  if (unassignedTasks.length === 0) {
    return { schedule: initialSchedule, success: true, errors: [] }
  }

  const errors: string[] = []
  let iterationCount = 0

  // Make a mutable copy of the schedule
  const schedule = [...initialSchedule]

  // Try to assign each unassigned task
  for (const task of unassignedTasks) {
    let assigned = false
    const periodsNeeded = task.periodsNeeded

    const qualifiedTeachers = teachers.filter((t) =>
      t.subjects.some((s) => s.toString() === task.subjectId)
    )

    const batch = batches.find((b) => b._id.toString() === task.batchId)
    if (!batch) continue

    const suitableClassrooms = classrooms.filter((c) => c.capacity >= batch.studentCount)

    let periodsAssigned = 0

    // Build slot usage from current schedule
    const slotUsage = buildSlotUsage(schedule)

    // Try all slots
    for (let slotIndex = 0; slotIndex < 36 && periodsAssigned < periodsNeeded; slotIndex++) {
      if (iterationCount >= MAX_BACKTRACK_ITERATIONS) {
        errors.push(
          `Could not assign ${periodsNeeded - periodsAssigned} periods for task ${task.id} within iteration limit`
        )
        break
      }

      iterationCount++

      const { day, period } = indexToSlot(slotIndex)

      // Check if batch is already occupied
      if (slotUsage[slotIndex].batches.has(task.batchId)) {
        continue
      }

      // Find available teacher
      const availableTeacher = qualifiedTeachers.find((t) => {
        const teacherId = t._id.toString()
        if (slotUsage[slotIndex].teachers.has(teacherId)) return false
        if (isSlotUnavailable(t.unavailableSlots, day, period)) return false

        // Check daily limit
        const teacherDailyCount = schedule.filter(
          (a) => a.teacherId === teacherId && a.day === day
        ).length
        if (teacherDailyCount >= t.maxPeriodsPerDay) return false

        // Check weekly limit
        const teacherWeeklyCount = schedule.filter(
          (a) => a.teacherId === teacherId
        ).length
        if (teacherWeeklyCount >= t.maxPeriodsPerWeek) return false

        return true
      })

      if (!availableTeacher) {
        // Try swapping with an existing assignment
        const conflictingAssignment = schedule.find(
          (a) =>
            slotToIndex(a.day, a.period) === slotIndex &&
            qualifiedTeachers.some((t) => t._id.toString() === a.teacherId)
        )

        if (conflictingAssignment) {
          // Try to move conflicting assignment to another slot
          // (Simplified swap logic - can be expanded)
          continue
        }

        continue
      }

      // Find available classroom
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

      periodsAssigned++
      assigned = true
    }

    if (periodsAssigned < periodsNeeded) {
      errors.push(
        `Could not assign all ${periodsNeeded} periods for task ${task.id}. Assigned: ${periodsAssigned}`
      )
    }
  }

  const success = errors.length === 0

  return {
    schedule,
    success,
    errors,
  }
}
