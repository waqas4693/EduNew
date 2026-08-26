import mongoose from 'mongoose'

const unitStatsSchema = new mongoose.Schema({
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    unique: true
  },
  totalSections: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

const UnitStats = mongoose.model('UnitStats', unitStatsSchema)
export default UnitStats 