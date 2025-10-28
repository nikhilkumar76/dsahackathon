import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Timetable from '@/lib/models/Timetable'
import Batch from '@/lib/models/Batch'
import { generateTimetable } from '@/lib/algorithms/scheduler'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, batchIds } = body

    // Validation
    const validationErrors = []

    if (!name || name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Timetable name must be at least 2 characters',
      })
    }

    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      validationErrors.push({
        field: 'batchIds',
        message: 'At least one batch must be selected',
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

    // Verify all batch IDs exist
    for (const batchId of batchIds) {
      const batchExists = await Batch.findById(batchId)
      if (!batchExists) {
        return NextResponse.json(
          {
            success: false,
            error: `Batch with ID ${batchId} does not exist`,
          },
          { status: 400 }
        )
      }
    }

    // Call algorithm to generate timetable
    const result = await generateTimetable(batchIds)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Timetable generation failed',
          details: result.errors,
        },
        { status: 400 }
      )
    }

    // Save timetable to database
    const timetable = new Timetable({
      name: name.trim(),
      generatedAt: new Date(),
      status: 'draft',
      schedule: result.schedule,
      metadata: result.metadata,
    })

    await timetable.save()

    return NextResponse.json(
      {
        success: true,
        data: timetable,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Generate timetable error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
