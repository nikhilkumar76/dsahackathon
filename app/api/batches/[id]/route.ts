import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
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

    const batch = await Batch.findById(id)
    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Validation
    const validationErrors = []

    if (body.name !== undefined && body.name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Batch name must be at least 2 characters',
      })
    }

    if (body.year !== undefined && body.year < 1) {
      validationErrors.push({
        field: 'year',
        message: 'Year must be a positive integer',
      })
    }

    if (body.studentCount !== undefined && body.studentCount < 1) {
      validationErrors.push({
        field: 'studentCount',
        message: 'Student count must be at least 1',
      })
    }

    if (body.subjectPeriods) {
      const total = Object.values(body.subjectPeriods).reduce(
        (sum: number, val: any) => sum + val,
        0
      )
      if (total > 36) {
        validationErrors.push({
          field: 'subjectPeriods',
          message: `Total periods (${total}) exceed 36`,
        })
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

    // Check uniqueness (excluding current batch)
    if (body.name) {
      const existing = await Batch.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Batch name already exists' },
          { status: 400 }
        )
      }
    }

    // Update fields
    if (body.name) batch.name = body.name.trim()
    if (body.year !== undefined) batch.year = body.year
    if (body.section !== undefined) batch.section = body.section?.trim()
    if (body.studentCount !== undefined) batch.studentCount = body.studentCount
    if (body.subjects !== undefined) batch.subjects = body.subjects
    if (body.subjectPeriods !== undefined)
      batch.subjectPeriods = new Map(Object.entries(body.subjectPeriods))

    await batch.save()
    await batch.populate('subjects')

    return NextResponse.json({
      success: true,
      data: batch,
    })
  } catch (error) {
    console.error('PUT batch error:', error)
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

    // Check if batch is used in timetables
    const usedInTimetable = await Timetable.findOne({ 'schedule.batchId': id })

    if (usedInTimetable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete batch - used in existing timetables',
        },
        { status: 400 }
      )
    }

    const batch = await Batch.findByIdAndDelete(id)

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    })
  } catch (error) {
    console.error('DELETE batch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
