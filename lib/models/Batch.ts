import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IBatch extends Document {
  name: string
  year: number
  section?: string
  studentCount: number
  subjects: Types.ObjectId[]
  subjectPeriods: Map<string, number>
  createdAt: Date
  updatedAt: Date
}

const BatchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Batch name must be at least 2 characters'],
      maxlength: [100, 'Batch name must not exceed 100 characters'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be a positive integer'],
    },
    section: {
      type: String,
      trim: true,
      maxlength: [10, 'Section must not exceed 10 characters'],
    },
    studentCount: {
      type: Number,
      required: [true, 'Student count is required'],
      min: [1, 'Student count must be at least 1'],
    },
    subjects: {
      type: [Schema.Types.ObjectId],
      ref: 'Subject',
      default: [],
    },
    subjectPeriods: {
      type: Map,
      of: Number,
      default: new Map(),
      validate: {
        validator: function (map: Map<string, number>) {
          const total = Array.from(map.values()).reduce((sum, val) => sum + val, 0)
          return total <= 36
        },
        message: 'Total periods across all subjects cannot exceed 36',
      },
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in development
const Batch: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema)

export default Batch
