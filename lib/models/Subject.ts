import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISubject extends Document {
  name: string
  code: string
  color: string
  createdAt: Date
  updatedAt: Date
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Subject name must be at least 2 characters'],
      maxlength: [100, 'Subject name must not exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
      validate: {
        validator: function (v: string) {
          return /^#[0-9A-Fa-f]{6}$/.test(v)
        },
        message: 'Color must be a valid hex color code (e.g., #3B82F6)',
      },
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in development
const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema)

export default Subject
