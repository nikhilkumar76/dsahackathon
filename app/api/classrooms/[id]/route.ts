import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Classroom from '@/lib/models/Classroom'
import Timetable from '@/lib/models/Timetable'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const id = params.id
    const body = await request.json()

    const classroom = await Classroom.findById(id)
    if (!classroom) {
      return NextResponse.json(
        { success: false, error: 'Classroom not found' },
        { status: 404 }
      )
    }

    // Validation
    const validationErrors = []

    if (body.name !== undefined && body.name.trim().length < 1) {
      validationErrors.push({
        field: 'name',
        message: 'Classroom name is required',
      })
    }

    if (body.capacity !== undefined && (body.capacity < 1 || body.capacity > 200)) {
      validationErrors.push({
        field: 'capacity',
        message: 'Capacity must be between 1 and 200',
      })
    }

    if (
      body.type !== undefined &&
      !['lecture', 'lab', 'seminar', 'auditorium'].includes(body.type)
    ) {
      validationErrors.push({
        field: 'type',
        message: 'Type must be one of: lecture, lab, seminar, auditorium',
      })
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

    // Check uniqueness (excluding current classroom)
    if (body.name) {
      const existing = await Classroom.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Classroom name already exists' },
          { status: 400 }
        )
      }
    }

    // Update fields
    if (body.name) classroom.name = body.name.trim()
    if (body.capacity !== undefined) classroom.capacity = body.capacity
    if (body.type) classroom.type = body.type
    if (body.facilities !== undefined) classroom.facilities = body.facilities
    if (body.unavailableSlots !== undefined)
      classroom.unavailableSlots = body.unavailableSlots

    await classroom.save()

    return NextResponse.json({
      success: true,
      data: classroom,
    })
  } catch (error) {
    console.error('PUT classroom error:', error)
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

    // Check if classroom is used in timetables
    const usedInTimetable = await Timetable.findOne({ 'schedule.classroomId': id })

    if (usedInTimetable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete classroom - used in existing timetables',
        },
        { status: 400 }
      )
    }

    const classroom = await Classroom.findByIdAndDelete(id)

    if (!classroom) {
      return NextResponse.json(
        { success: false, error: 'Classroom not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Classroom deleted successfully',
    })
  } catch (error) {
    console.error('DELETE classroom error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
