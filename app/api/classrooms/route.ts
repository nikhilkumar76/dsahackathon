import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Classroom from '@/lib/models/Classroom'

export async function GET() {
  try {
    await connectDB()

    const classrooms = await Classroom.find({}).sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: classrooms,
    })
  } catch (error) {
    console.error('GET classrooms error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, capacity, type, facilities, unavailableSlots } = body

    // Validation
    const validationErrors = []

    if (!name || name.trim().length < 1) {
      validationErrors.push({
        field: 'name',
        message: 'Classroom name is required',
      })
    }

    if (!capacity || capacity < 1 || capacity > 200) {
      validationErrors.push({
        field: 'capacity',
        message: 'Capacity must be between 1 and 200',
      })
    }

    if (!type || !['lecture', 'lab', 'seminar', 'auditorium'].includes(type)) {
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

    // Check uniqueness
    const existing = await Classroom.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Classroom name already exists' },
        { status: 400 }
      )
    }

    const classroom = new Classroom({
      name: name.trim(),
      capacity,
      type,
      facilities: facilities || [],
      unavailableSlots: unavailableSlots || [],
    })

    await classroom.save()

    return NextResponse.json(
      {
        success: true,
        data: classroom,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST classroom error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
