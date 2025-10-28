import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Batch from '@/lib/models/Batch'
import Subject from '@/lib/models/Subject'

export async function GET() {
  try {
    await connectDB()

    const batches = await Batch.find({}).populate('subjects').sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: batches,
    })
  } catch (error) {
    console.error('GET batches error:', error)
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
    const { name, year, section, studentCount, subjects, subjectPeriods } = body

    // Validation
    const validationErrors = []

    if (!name || name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Batch name must be at least 2 characters',
      })
    }

    if (!year || year < 1) {
      validationErrors.push({
        field: 'year',
        message: 'Year must be a positive integer',
      })
    }

    if (!studentCount || studentCount < 1) {
      validationErrors.push({
        field: 'studentCount',
        message: 'Student count must be at least 1',
      })
    }

    // Validate subject periods total
    if (subjectPeriods) {
      const total = Object.values(subjectPeriods).reduce(
        (sum: number, val: any) => sum + val,
        0
      )
      if (total > 36) {
        validationErrors.push({
          field: 'subjectPeriods',
          message: `Total periods (${total}) exceed 36`,
        })
      }

      // Validate all subject IDs exist
      for (const subjectId of Object.keys(subjectPeriods)) {
        const subjectExists = await Subject.findById(subjectId)
        if (!subjectExists) {
          validationErrors.push({
            field: 'subjectPeriods',
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

    // Check uniqueness
    const existing = await Batch.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Batch name already exists' },
        { status: 400 }
      )
    }

    const batch = new Batch({
      name: name.trim(),
      year,
      section: section?.trim(),
      studentCount,
      subjects: subjects || [],
      subjectPeriods: new Map(Object.entries(subjectPeriods || {})),
    })

    await batch.save()
    await batch.populate('subjects')

    return NextResponse.json(
      {
        success: true,
        data: batch,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST batch error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
