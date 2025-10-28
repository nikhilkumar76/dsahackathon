import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Subject from '@/lib/models/Subject'
import Teacher from '@/lib/models/Teacher'
import Batch from '@/lib/models/Batch'
import Timetable from '@/lib/models/Timetable'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const id = params.id
    const body = await request.json()
    const { name, code, color } = body

    const subject = await Subject.findById(id)
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Validation
    const validationErrors = []

    if (name !== undefined && name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Subject name must be at least 2 characters',
      })
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      validationErrors.push({
        field: 'color',
        message: 'Color must be a valid hex color code',
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

    // Check uniqueness (excluding current subject)
    if (name || code) {
      const codeUpper = code ? code.toUpperCase() : subject.code
      const nameToCheck = name ? name.trim() : subject.name

      const existing = await Subject.findOne({
        _id: { $ne: id },
        $or: [
          { name: { $regex: new RegExp(`^${nameToCheck}$`, 'i') } },
          { code: codeUpper },
        ],
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Subject name or code already exists' },
          { status: 400 }
        )
      }
    }

    // Update fields
    if (name) subject.name = name.trim()
    if (code) subject.code = code.toUpperCase()
    if (color) subject.color = color

    await subject.save()

    return NextResponse.json({
      success: true,
      data: subject,
    })
  } catch (error) {
    console.error('PUT subject error:', error)
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

    // Check if subject is referenced
    const [usedByTeachers, usedByBatches, usedByTimetables] = await Promise.all([
      Teacher.findOne({ subjects: id }),
      Batch.findOne({ subjects: id }),
      Timetable.findOne({ 'schedule.subjectId': id }),
    ])

    if (usedByTeachers || usedByBatches || usedByTimetables) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete subject - used by teachers, batches, or timetables',
        },
        { status: 400 }
      )
    }

    const subject = await Subject.findByIdAndDelete(id)

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    })
  } catch (error) {
    console.error('DELETE subject error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
