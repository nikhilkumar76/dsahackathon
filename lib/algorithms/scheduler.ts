import { Types } from 'mongoose'
import { analyze } from './preprocessor'
import { allocate } from './greedy-scheduler'
import { resolve } from './backtrack-resolver'
import { optimize } from './optimizer'
import { ScheduleEntry } from '../models/Timetable'

export interface TimetableResult {
  success: boolean
  schedule: ScheduleEntry[] | null
  metadata: {
    executionTimeMs: number
    totalTasks: number
    conflictsResolved: number
    algorithmPhases: {
      preprocessing: number
      greedy: number
      backtracking: number
      optimization: number
    }
  }
  errors?: string[]
}

export async function generateTimetable(batchIds: string[]): Promise<TimetableResult> {
  const startTime = Date.now()
  let phase1Time = 0
  let phase2Time = 0
  let phase3Time = 0
  let phase4Time = 0

  try {
    // Phase 1: Preprocessing
    const phase1Start = Date.now()
    const preprocessingResult = await analyze(batchIds)
    phase1Time = Date.now() - phase1Start

    // Check for preprocessing errors
    if (preprocessingResult.errors.length > 0) {
      return {
        success: false,
        schedule: null,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          totalTasks: 0,
          conflictsResolved: 0,
          algorithmPhases: {
            preprocessing: phase1Time,
            greedy: 0,
            backtracking: 0,
            optimization: 0,
          },
        },
        errors: preprocessingResult.errors,
      }
    }

    // Phase 2: Greedy allocation
    const phase2Start = Date.now()
    const greedyResult = allocate(
      preprocessingResult.priorityQueue,
      preprocessingResult.validityMatrix,
      preprocessingResult.teachers,
      preprocessingResult.classrooms,
      preprocessingResult.batches
    )
    phase2Time = Date.now() - phase2Start

    let finalSchedule = greedyResult.schedule

    // Phase 3: Backtracking (if needed)
    const phase3Start = Date.now()
    if (greedyResult.unassigned.length > 0) {
      const backtrackResult = resolve(
        greedyResult.schedule,
        greedyResult.unassigned,
        preprocessingResult.teachers,
        preprocessingResult.classrooms,
        preprocessingResult.batches
      )
      phase3Time = Date.now() - phase3Start

      if (!backtrackResult.success) {
        return {
          success: false,
          schedule: null,
          metadata: {
            executionTimeMs: Date.now() - startTime,
            totalTasks: preprocessingResult.constraintGraph.getAllTasks().length,
            conflictsResolved: 0,
            algorithmPhases: {
              preprocessing: phase1Time,
              greedy: phase2Time,
              backtracking: phase3Time,
              optimization: 0,
            },
          },
          errors: backtrackResult.errors,
        }
      }

      finalSchedule = backtrackResult.schedule
    } else {
      phase3Time = Date.now() - phase3Start
    }

    // Phase 4: Optimization
    const phase4Start = Date.now()
    const optimizedSchedule = optimize(
      finalSchedule,
      preprocessingResult.teachers,
      preprocessingResult.batches
    )
    phase4Time = Date.now() - phase4Start

    // Convert to ScheduleEntry format
    const scheduleEntries: ScheduleEntry[] = optimizedSchedule.map((assignment) => ({
      day: assignment.day,
      period: assignment.period,
      teacherId: new Types.ObjectId(assignment.teacherId),
      subjectId: new Types.ObjectId(assignment.subjectId),
      classroomId: new Types.ObjectId(assignment.classroomId),
      batchId: new Types.ObjectId(assignment.batchId),
    }))

    const totalTasks = preprocessingResult.constraintGraph.getAllTasks().length
    const conflictsResolved = greedyResult.unassigned.length

    return {
      success: true,
      schedule: scheduleEntries,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        totalTasks,
        conflictsResolved,
        algorithmPhases: {
          preprocessing: phase1Time,
          greedy: phase2Time,
          backtracking: phase3Time,
          optimization: phase4Time,
        },
      },
    }
  } catch (error) {
    console.error('Timetable generation error:', error)
    return {
      success: false,
      schedule: null,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        totalTasks: 0,
        conflictsResolved: 0,
        algorithmPhases: {
          preprocessing: phase1Time,
          greedy: phase2Time,
          backtracking: phase3Time,
          optimization: phase4Time,
        },
      },
      errors: ['Internal error during timetable generation'],
    }
  }
}
