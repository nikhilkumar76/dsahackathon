import mongoose, { Schema, Document, Model } from 'mongoose'

export interface TimeSlot {
  day: number // 1-6
  period: number // 1-6
}

export interface IClassroom extends Document {
  name: string
  capacity: number
  type: 'lecture' | 'lab' | 'seminar' | 'auditorium'
  facilities: string[]
  unavailableSlots: TimeSlot[]
  createdAt: Date
  updatedAt: Date
}

const TimeSlotSchema = new Schema<TimeSlot>(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
  },
  { _id: false }
)

const ClassroomSchema = new Schema<IClassroom>(
  {
    name: {
      type: String,
      required: [true, 'Classroom name is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Classroom name must be at least 1 character'],
      maxlength: [100, 'Classroom name must not exceed 100 characters'],
    },
    capacity: {
      type: Number,
      required: [true, 'Classroom capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [200, 'Capacity must not exceed 200'],
    },
    type: {
      type: String,
      required: [true, 'Classroom type is required'],
      enum: {
        values: ['lecture', 'lab', 'seminar', 'auditorium'],
        message: 'Type must be one of: lecture, lab, seminar, auditorium',
      },
    },
    facilities: {
      type: [String],
      default: [],
    },
    unavailableSlots: {
      type: [TimeSlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in development
const Classroom: Model<IClassroom> =
  mongoose.models.Classroom || mongoose.model<IClassroom>('Classroom', ClassroomSchema)

export default Classroom
