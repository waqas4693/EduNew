import mongoose from 'mongoose'

const assessmentSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  }
}, {
  timestamps: true      
})

export default mongoose.model('Assessment', assessmentSchema) 