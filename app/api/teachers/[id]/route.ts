import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Teacher from '@/lib/models/Teacher'
import Subject from '@/lib/models/Subject'
import Timetable from '@/lib/models/Timetable'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const id = params.id
    const body = await request.json()

    const teacher = await Teacher.findById(id)
    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Validation
    const validationErrors = []

    if (body.name !== undefined && body.name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Teacher name must be at least 2 characters',
      })
    }

    if (body.email !== undefined && body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      validationErrors.push({
        field: 'email',
        message: 'Invalid email format',
      })
    }

    if (
      body.maxPeriodsPerDay !== undefined &&
      (body.maxPeriodsPerDay < 1 || body.maxPeriodsPerDay > 6)
    ) {
      validationErrors.push({
        field: 'maxPeriodsPerDay',
        message: 'Max periods per day must be between 1 and 6',
      })
    }

    if (
      body.maxPeriodsPerWeek !== undefined &&
      (body.maxPeriodsPerWeek < 1 || body.maxPeriodsPerWeek > 36)
    ) {
      validationErrors.push({
        field: 'maxPeriodsPerWeek',
        message: 'Max periods per week must be between 1 and 36',
      })
    }

    if (body.subjects) {
      for (const subjectId of body.subjects) {
        const subjectExists = await Subject.findById(subjectId)
        if (!subjectExists) {
          validationErrors.push({
            field: 'subjects',
            message: `Subject with ID ${subjectId} does not exist`,
          })
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validationErrors,
        },
        { status: 400 }
      )
    }

    // Update fields
    if (body.name) teacher.name = body.name.trim()
    if (body.email !== undefined) teacher.email = body.email?.trim()
    if (body.subjects) teacher.subjects = body.subjects
    if (body.maxPeriodsPerDay !== undefined)
      teacher.maxPeriodsPerDay = body.maxPeriodsPerDay
    if (body.maxPeriodsPerWeek !== undefined)
      teacher.maxPeriodsPerWeek = body.maxPeriodsPerWeek
    if (body.unavailableSlots !== undefined)
      teacher.unavailableSlots = body.unavailableSlots
    if (body.preferredSlots !== undefined) teacher.preferredSlots = body.preferredSlots

    await teacher.save()
    await teacher.populate('subjects')

    return NextResponse.json({
      success: true,
      data: teacher,
    })
  } catch (error) {
    console.error('PUT teacher error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const id = params.id

    // Check if teacher is used in timetables
    const usedInTimetable = await Timetable.findOne({ 'schedule.teacherId': id })

    if (usedInTimetable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete teacher - used in existing timetables',
        },
        { status: 400 }
      )
    }

    const teacher = await Teacher.findByIdAndDelete(id)

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    })
  } catch (error) {
    console.error('DELETE teacher error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
