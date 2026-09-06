/** Exact phrase admins must type to authorize permanent deletion. */
export const HARD_DELETE_CONSENT =
  'I hereby consent to forever delete this data and all related records.'

export const HARD_DELETE_IMPACT = {
  course:
    'This will permanently delete this course and its entire hierarchy: all units, sections, resources, assessments, assessment attempts, student progress, unlock records, enrollments/assignments, and related uploaded files. This cannot be undone.',
  unit:
    'This will permanently delete this unit and everything under it: all sections, resources, assessments, assessment attempts, related student progress, and uploaded files. This cannot be undone.',
  section:
    'This will permanently delete this section and everything under it: all resources, assessments, assessment attempts, related student progress, and uploaded files. This cannot be undone.',
  resource:
    'This will permanently delete this resource, its uploaded files, and related progress references. This cannot be undone.',
  assessment:
    'This will permanently delete this assessment, all student attempts/submissions, feedback files, and related uploaded files. This cannot be undone.'
}
