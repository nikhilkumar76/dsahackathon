import { Types } from 'mongoose'
import Teacher, { ITeacher } from '../models/Teacher'
import Subject, { ISubject } from '../models/Subject'
import Classroom, { IClassroom } from '../models/Classroom'
import Batch, { IBatch } from '../models/Batch'
import { PriorityQueue } from './data-structures/PriorityQueue'
import { ConstraintGraph, Task } from './data-structures/ConstraintGraph'

export interface PreprocessingResult {
  priorityQueue: PriorityQueue<Task>
  constraintGraph: ConstraintGraph
  validityMatrix: Map<string, boolean[]> // taskId -> array of 36 slot validity flags
  teachers: ITeacher[]
  subjects: ISubject[]
  classrooms: IClassroom[]
  batches: IBatch[]
  errors: string[]
}

interface SlotKey {
  day: number
  period: number
}

function slotToIndex(day: number, period: number): number {
  return (day - 1) * 6 + (period - 1)
}

function isSlotUnavailable(
  unavailableSlots: { day: number; period: number }[],
  day: number,
  period: number
): boolean {
  return unavailableSlots.some((slot) => slot.day === day && slot.period === period)
}

export async function analyze(batchIds: string[]): Promise<PreprocessingResult> {
  const errors: string[] = []
  const constraintGraph = new ConstraintGraph()
  const priorityQueue = new PriorityQueue<Task>()

  // Step 1: Load all entities
  const batches = await Batch.find({ _id: { $in: batchIds } }).populate('subjects')
  const teachers = await Teacher.find({}).populate('subjects')
  const subjects = await Subject.find({})
  const classrooms = await Classroom.find({})

  if (batches.length === 0) {
    errors.push('No batches found for the provided IDs')
    return {
      priorityQueue,
      constraintGraph,
      validityMatrix: new Map(),
      teachers: [],
      subjects: [],
      classrooms: [],
      batches: [],
      errors,
    }
  }

  // Step 2: Build tasks from batch requirements
  const tasks: Task[] = []
  const subjectTeacherMap = new Map<string, ITeacher[]>()

  // Group teachers by subjects they can teach
  for (const teacher of teachers) {
    for (const subjectId of teacher.subjects) {
      const subjectIdStr = subjectId.toString()
      if (!subjectTeacherMap.has(subjectIdStr)) {
        subjectTeacherMap.set(subjectIdStr, [])
      }
      subjectTeacherMap.get(subjectIdStr)!.push(teacher)
    }
  }

  // Create tasks for each batch-subject combination
  for (const batch of batches) {
    for (const [subjectIdStr, periodsNeeded] of batch.subjectPeriods.entries()) {
      const subjectId = subjectIdStr

      // Check if there are qualified teachers for this subject
      const qualifiedTeachers = subjectTeacherMap.get(subjectId) || []
      if (qualifiedTeachers.length === 0) {
        const subject = subjects.find((s) => s._id.toString() === subjectId)
        errors.push(
          `Subject ${subject?.name || subjectId} has no qualified teachers`
        )
        continue
      }

      // Check if classroom capacity is sufficient
      const suitableClassrooms = classrooms.filter(
        (c) => c.capacity >= batch.studentCount
      )
      if (suitableClassrooms.length === 0) {
        errors.push(
          `No classroom can accommodate Batch ${batch.name} (${batch.studentCount} students). Largest available capacity: ${Math.max(...classrooms.map((c) => c.capacity))}`
        )
        continue
      }

      // Create task for this batch-subject combination
      const task: Task = {
        id: `${batch._id.toString()}-${subjectId}`,
        batchId: batch._id.toString(),
        subjectId: subjectId,
        periodsNeeded: periodsNeeded,
      }

      tasks.push(task)
      constraintGraph.addNode(task)
    }
  }

  // Step 3: Build constraint graph edges
  // Tasks conflict if they share same batch (batch cannot be in two places at once)
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      if (tasks[i].batchId === tasks[j].batchId) {
        constraintGraph.addEdge(tasks[i].id, tasks[j].id)
      }
    }
  }

  // Step 4: Pre-compute validity matrix
  const validityMatrix = new Map<string, boolean[]>()

  for (const task of tasks) {
    const validity = new Array(36).fill(true)

    // Find teachers who can teach this subject
    const qualifiedTeachers = subjectTeacherMap.get(task.subjectId) || []

    // Mark slots as invalid if ALL qualified teachers are unavailable
    for (let day = 1; day <= 6; day++) {
      for (let period = 1; period <= 6; period++) {
        const slotIndex = slotToIndex(day, period)

        // Check if at least one qualified teacher is available for this slot
        const hasAvailableTeacher = qualifiedTeachers.some(
          (teacher) => !isSlotUnavailable(teacher.unavailableSlots, day, period)
        )

        if (!hasAvailableTeacher) {
          validity[slotIndex] = false
        }

        // Check if at least one suitable classroom is available
        const suitableClassrooms = classrooms.filter(
          (c) => c.capacity >= (batches.find((b) => b._id.toString() === task.batchId)?.studentCount || 0)
        )
        const hasAvailableClassroom = suitableClassrooms.some(
          (classroom) => !isSlotUnavailable(classroom.unavailableSlots, day, period)
        )

        if (!hasAvailableClassroom) {
          validity[slotIndex] = false
        }
      }
    }

    validityMatrix.set(task.id, validity)
  }

  // Step 5: Calculate priority scores and populate priority queue
  for (const task of tasks) {
    const constraintCount = constraintGraph.getConstraintCount(task.id)
    const availableSlots = validityMatrix.get(task.id)!.filter((v) => v).length

    // Check teacher load (simplified - use average load across qualified teachers)
    const qualifiedTeachers = subjectTeacherMap.get(task.subjectId) || []
    const avgTeacherLoad =
      qualifiedTeachers.reduce((sum, t) => sum + t.maxPeriodsPerWeek, 0) /
      Math.max(qualifiedTeachers.length, 1)
    const teacherLoad = avgTeacherLoad / 36 // Normalize to 0-1

    // Priority Score = (constraintCount * 10) + (teacherLoad * 5) - (availableSlots * 2)
    const priorityScore =
      constraintCount * 10 + teacherLoad * 5 - availableSlots * 0.5

    priorityQueue.enqueue(task, priorityScore)
  }

  // Step 6: Validate capacity constraints
  for (const batch of batches) {
    const totalPeriods = Array.from(batch.subjectPeriods.values()).reduce(
      (sum, val) => sum + val,
      0
    )
    if (totalPeriods > 36) {
      errors.push(
        `Batch ${batch.name} requires ${totalPeriods} periods, which exceeds the maximum of 36`
      )
    }
  }

  // Check teacher capacity for each subject
  for (const [subjectId, teacherList] of subjectTeacherMap.entries()) {
    const totalRequired = batches.reduce((sum, batch) => {
      return sum + (batch.subjectPeriods.get(subjectId) || 0)
    }, 0)

    const totalCapacity = teacherList.reduce((sum, teacher) => {
      return sum + teacher.maxPeriodsPerWeek
    }, 0)

    if (totalRequired > totalCapacity) {
      const subject = subjects.find((s) => s._id.toString() === subjectId)
      errors.push(
        `Teachers cannot cover required ${totalRequired} periods for ${subject?.name || subjectId} (total capacity: ${totalCapacity})`
      )
    }
  }

  return {
    priorityQueue,
    constraintGraph,
    validityMatrix,
    teachers,
    subjects,
    classrooms,
    batches,
    errors,
  }
}
