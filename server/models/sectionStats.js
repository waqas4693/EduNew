import mongoose from 'mongoose'

const sectionStatsSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
    unique: true
  },
  totalResources: {
    type: Number,
    default: 0
  },
  totalMcqs: {
    type: Number,
    default: 0
  },
  totalAssessments: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

const SectionStats = mongoose.model('SectionStats', sectionStatsSchema)
export default SectionStats 