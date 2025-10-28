import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connection'
import Teacher from '@/lib/models/Teacher'
import Subject from '@/lib/models/Subject'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    let query = {}
    if (search) {
      query = { name: { $regex: search, $options: 'i' } }
    }

    const teachers = await Teacher.find(query).populate('subjects').sort({ name: 1 })

    return NextResponse.json({
      success: true,
      data: teachers,
    })
  } catch (error) {
    console.error('GET teachers error:', error)
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
    const {
      name,
      email,
      subjects,
      maxPeriodsPerDay,
      maxPeriodsPerWeek,
      unavailableSlots,
      preferredSlots,
    } = body

    // Validation
    const validationErrors = []

    if (!name || name.trim().length < 2) {
      validationErrors.push({
        field: 'name',
        message: 'Teacher name must be at least 2 characters',
      })
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({
        field: 'email',
        message: 'Invalid email format',
      })
    }

    if (maxPeriodsPerDay !== undefined && (maxPeriodsPerDay < 1 || maxPeriodsPerDay > 6)) {
      validationErrors.push({
        field: 'maxPeriodsPerDay',
        message: 'Max periods per day must be between 1 and 6',
      })
    }

    if (
      maxPeriodsPerWeek !== undefined &&
      (maxPeriodsPerWeek < 1 || maxPeriodsPerWeek > 36)
    ) {
      validationErrors.push({
        field: 'maxPeriodsPerWeek',
        message: 'Max periods per week must be between 1 and 36',
      })
    }

    // Validate subjects exist
    if (subjects && subjects.length > 0) {
      for (const subjectId of subjects) {
        const subjectExists = await Subject.findById(subjectId)
        if (!subjectExists) {
          validationErrors.push({
            field: 'subjects',
            message: `Subject with ID ${subjectId} does not exist`,
          })
        }
      }
    }

    // Validate time slots
    if (unavailableSlots) {
      for (const slot of unavailableSlots) {
        if (slot.day < 1 || slot.day > 6 || slot.period < 1 || slot.period > 6) {
          validationErrors.push({
            field: 'unavailableSlots',
            message: 'Invalid time slot (day: 1-6, period: 1-6)',
          })
          break
        }
      }
    }

    if (preferredSlots) {
      for (const slot of preferredSlots) {
        if (slot.day < 1 || slot.day > 6 || slot.period < 1 || slot.period > 6) {
          validationErrors.push({
            field: 'preferredSlots',
            message: 'Invalid time slot (day: 1-6, period: 1-6)',
          })
          break
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

    const teacher = new Teacher({
      name: name.trim(),
      email: email?.trim(),
      subjects: subjects || [],
      maxPeriodsPerDay: maxPeriodsPerDay ?? 6,
      maxPeriodsPerWeek: maxPeriodsPerWeek ?? 30,
      unavailableSlots: unavailableSlots || [],
      preferredSlots: preferredSlots || [],
    })

    await teacher.save()
    await teacher.populate('subjects')

    return NextResponse.json(
      {
        success: true,
        data: teacher,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST teacher error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
