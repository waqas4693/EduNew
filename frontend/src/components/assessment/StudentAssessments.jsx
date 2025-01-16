import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip
} from '@mui/material';
import { getData } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

const StudentAssessments = ({ isAdminView }) => {
  const [assessments, setAssessments] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const { user } = useAuth();
  const { studentId } = useParams();

  useEffect(() => {
    fetchAssessments();
  }, [studentId]);

  const fetchAssessments = async () => {
    try {
      const id = isAdminView ? studentId : user.studentId;
      console.log('Student ID:')
      console.log(id)
      const response = await getData(`assessment-review/student/${id}`);
      if (response.status === 200) {
        setAssessments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const filteredAssessments = assessments.filter(assessment => 
    tabValue === 0 
      ? assessment.status === 'SUBMITTED'
      : assessment.status === 'GRADED'
  );

  const handleReview = (attempt) => {
    setSelectedAttempt(attempt);
    setOpenReviewDialog(true);
  };

  const renderMCQAnswers = (content, originalMCQs) => {
    if (!content?.mcqAnswers || !originalMCQs) return null;

    return originalMCQs.map((mcq, index) => {
      const answer = content.mcqAnswers[index] || {};
      const isCorrect = answer.selectedOption === mcq.correctAnswer;

      return (
        <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Question {index + 1}: {mcq.question}
          </Typography>
          
          <Box sx={{ mt: 1 }}>
            {mcq.options.map((option, optIndex) => (
              <Typography 
                key={optIndex}
                variant="body2"
                sx={{
                  p: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  bgcolor: answer.selectedOption === option 
                    ? isCorrect ? 'success.light' : 'error.light'
                    : 'transparent',
                  color: answer.selectedOption === option ? 'white' : 'text.primary'
                }}
              >
                {`${String.fromCharCode(65 + optIndex)}. ${option}`}
                {answer.selectedOption === option && (isCorrect ? ' ✓' : ' ✗')}
              </Typography>
            ))}
          </Box>
        </Box>
      );
    });
  };

  const renderAssessmentContent = (attempt) => {
    const { content, assessmentId } = attempt;

    return (
      <Stack spacing={3}>
        {content.answers?.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Text Answers</Typography>
            {content.answers.map((answer, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Question {index + 1}
                </Typography>
                <Typography>{answer.answer}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {content.mcqAnswers?.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Multiple Choice Answers</Typography>
            {renderMCQAnswers(content, assessmentId.content.mcqs)}
          </Box>
        )}

        {content.submittedFile && (
          <Box>
            <Typography variant="h6" gutterBottom>Submitted File</Typography>
            <Button 
              variant="outlined" 
              href={content.submittedFile} 
              target="_blank"
            >
              View Submitted File
            </Button>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={5} sx={{ p: '20px', borderRadius: '16px' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          {isAdminView ? "Student's Assessments" : "My Assessments"}
        </Typography>

        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Submitted" />
          <Tab label="Graded" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssessments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((attempt) => (
                  <TableRow key={attempt._id}>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.courseId?.name}</TableCell>
                    <TableCell>{attempt.assessmentId?.sectionId?.unitId?.name}</TableCell>
                    <TableCell>{attempt.assessmentId?.assessmentType}</TableCell>
                    <TableCell>{new Date(attempt.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={attempt.status} 
                        color={attempt.status === 'GRADED' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {attempt.status === 'GRADED' 
                        ? `${attempt.obtainedMarks}/${attempt.assessmentId.totalMarks}`
                        : attempt.assessmentId.assessmentType === 'MCQ'
                          ? `${Math.round(attempt.calculatedMarks)}/${attempt.totalPossibleMarks}`
                          : 'Pending'
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="outlined" 
                        onClick={() => handleReview(attempt)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAssessments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />

        <Dialog 
          open={openReviewDialog} 
          onClose={() => setOpenReviewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Assessment Details</DialogTitle>
          <DialogContent dividers>
            {selectedAttempt && renderAssessmentContent(selectedAttempt)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

StudentAssessments.defaultProps = {
  isAdminView: false
};

export default StudentAssessments; 