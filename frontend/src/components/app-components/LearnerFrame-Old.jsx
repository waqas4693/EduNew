import Grid from '@mui/material/Grid2'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  LinearProgress
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material'
import { getData, postData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ResourceRenderer from './ResourceRenderer'

const formatExternalUrl = url => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

const getIdString = (idValue) => {
  if (typeof idValue === 'string') {
    return idValue;
  } else if (idValue && idValue._id) {
    return idValue._id.toString();
  } else if (idValue && typeof idValue.toString === 'function') {
    return idValue.toString();
  }
  return null;
};

const LearnerFrame = () => {
  // Consolidated state management
  const [resources, setResources] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [signedUrls, setSignedUrls] = useState({});
  const [loading, setLoading] = useState({
    resources: true,
    urls: false,
    progress: false
  });
  const [progress, setProgress] = useState({
    section: 0,
    mcq: 0,
    totalMcqs: 0,
    completedMcqs: 0,
    studentProgress: null
  });
  const [urlRefreshTimer, setUrlRefreshTimer] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const navigate = useNavigate();
  const { courseId, unitId, sectionId } = useParams();
  const { user } = useAuth();

  // Add new state for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    hasMore: true
  });

  // Optimized function using getData from api.js
  const getSignedS3Url = async (fileName, folder) => {
    try {
      const response = await getData(`resources/files/url/${folder}/${fileName}`);
      return response.data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  // Function to fetch all required signed URLs for a resource
  const fetchSignedUrls = async (resource) => {
    const urls = {};
    
    try {
      // Main resource file
      if (resource.content.fileName) {
        urls[resource.content.fileName] = await getSignedS3Url(
          resource.content.fileName,
          resource.resourceType
        );
      }

      // Background image
      if (resource.content.backgroundImage) {
        urls[resource.content.backgroundImage] = await getSignedS3Url(
          resource.content.backgroundImage,
          'BACKGROUNDS'
        );
      }

      // PDF audio file
      if (resource.resourceType === 'PDF' && resource.content.audioFile) {
        urls[resource.content.audioFile] = await getSignedS3Url(
          resource.content.audioFile,
          'AUDIO'
        );
      }

      // MCQ related files
      if (resource.resourceType === 'MCQ') {
        if (resource.content.mcq?.imageFile) {
          urls[resource.content.mcq.imageFile] = await getSignedS3Url(
            resource.content.mcq.imageFile,
            'MCQ_IMAGES'
          );
        }
        if (resource.content.mcq?.audioFile) {
          urls[resource.content.mcq.audioFile] = await getSignedS3Url(
            resource.content.mcq.audioFile,
            'MCQ_AUDIO'
          );
        }
      }

      return urls;
    } catch (error) {
      console.error('Error fetching signed URLs:', error);
      return urls;
    }
  };

  // Modified fetchResources to handle pagination
  const fetchResources = async (page = 1) => {
    setLoading(prev => ({ ...prev, resources: true }));
    try {
      const response = await getData(`resources/${sectionId}?page=${page}&limit=15`);
      if (response.status === 200) {
        const { resources: newResources, total, totalPages, hasMore } = response.data;
        
        // If it's the first page, replace resources, otherwise append
        setResources(prev => page === 1 ? newResources : [...prev, ...newResources]);
        
        setPagination({
          page,
          total,
          totalPages,
          hasMore
        });

        // Fetch signed URLs for new resources
        setLoading(prev => ({ ...prev, urls: true }));
        const allUrls = { ...signedUrls };
        for (const resource of newResources) {
          const resourceUrls = await fetchSignedUrls(resource);
          Object.assign(allUrls, resourceUrls);
        }
        setSignedUrls(allUrls);
        setLoading(prev => ({ ...prev, urls: false }));

        // Set up URL refresh timer (every 45 minutes)
        if (urlRefreshTimer) clearInterval(urlRefreshTimer);
        const timer = setInterval(() => {
          refreshSignedUrls(newResources);
        }, 45 * 60 * 1000); // 45 minutes
        setUrlRefreshTimer(timer);
        
        // After resources are loaded, fetch student progress
        await fetchStudentProgress(newResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(prev => ({ ...prev, resources: false }));
    }
  };

  // Modified navigation handlers to load more resources when needed
  const handleNext = async () => {
    if (currentIndex < resources.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // If we're near the end of loaded resources, load more
      if (nextIndex >= resources.length - 5 && pagination.hasMore) {
        await fetchResources(pagination.page + 1);
      }
      
      // Update last accessed resource
      if (resources[nextIndex]) {
        updateLastAccessedResource(resources[nextIndex]._id);
      }
      
      // Record resource view
      if (resources[nextIndex]) {
        recordResourceView(resources[nextIndex]);
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      // Update last accessed resource
      if (resources[prevIndex]) {
        updateLastAccessedResource(resources[prevIndex]._id);
      }
      
      // Record resource view
      if (resources[prevIndex]) {
        recordResourceView(resources[prevIndex]);
      }
    }
  };

  // Remove the scroll-based loading
  useEffect(() => {
    setPagination({
      page: 1,
      total: 0,
      totalPages: 0,
      hasMore: true
    });
    fetchResources(1);
  }, [sectionId]);

  // Update last accessed resource
  const updateLastAccessedResource = async (resourceId) => {
    if (!user?.studentId) return;
    
    try {
      await postData(`student-progress/last-accessed/${user.studentId}/${courseId}/${unitId}/${sectionId}`, {
        resourceId: resourceId
      });
    } catch (error) {
      console.error('Error updating last accessed resource:', error);
    }
  };

  // Record resource view
  const recordResourceView = async (resource) => {
    if (!user?.studentId) return;
    
    try {
      await postData('resource-views/record', {
        studentId: user.studentId,
        resourceId: resource._id,
        courseId,
        unitId,
        sectionId
      });
    } catch (error) {
      console.error('Error recording resource view:', error);
    }
  };

  // Record view when current resource changes
  useEffect(() => {
    if (resources[currentIndex]) {
      recordResourceView(resources[currentIndex]);
    }
  }, [currentIndex, resources]);

  // Optimized section progress calculation with memoization
  useEffect(() => {
    const fetchSectionProgress = async () => {
      if (!user?.studentId || !sectionId || !resources?.length) {
        setProgress(prev => ({ ...prev, section: 0 }));
        return;
      }

      setLoading(prev => ({ ...prev, progress: true }));
      try {
        const response = await getData(`resource-views/student/${user.studentId}`);
        if (response.status === 200) {
          const allViews = response.data.data;
          
          // Filter views for the current section
          const currentSectionViews = allViews.filter(view => 
            view.sectionId?._id?.toString() === sectionId.toString()
          );

          // Get unique viewed resource IDs in current section
          const viewedResourceIds = new Set();
          currentSectionViews.forEach(view => {
            const resourceId = getIdString(view.resourceId);
            if (resourceId) {
              viewedResourceIds.add(resourceId);
            }
          });

          // Calculate progress
          const totalResourcesInSection = resources.length;
          const viewedResourcesCount = viewedResourceIds.size;
          const calculatedProgress = (viewedResourcesCount / totalResourcesInSection) * 100;
          
          setProgress(prev => ({ ...prev, section: calculatedProgress }));
        }
      } catch (error) {
        console.error('Error calculating section progress:', error);
        setProgress(prev => ({ ...prev, section: 0 }));
      } finally {
        setLoading(prev => ({ ...prev, progress: false }));
      }
    };

    fetchSectionProgress();
  }, [user?.studentId, sectionId, resources.length, currentIndex]);

  // Optimized student progress fetching
  const fetchStudentProgress = async (resourcesList = null) => {
    if (!user?.studentId) return;
    
    // Use the passed resources list or the current state
    const currentResources = resourcesList || resources;
    if (!currentResources.length) return;
    
    setLoading(prev => ({ ...prev, progress: true }));
    try {
      const response = await getData(`student-progress/${user.studentId}/${courseId}/${unitId}/${sectionId}`);
      if (response.status === 200) {
        const progressData = response.data.data.progress;
        
        // Update progress state
        setProgress({
          ...progress,
          studentProgress: progressData,
          totalMcqs: response.data.data.totalMcqs,
          completedMcqs: response.data.data.completedMcqs,
          mcq: response.data.data.mcqProgressPercentage
        });
        
        // Mark all completed MCQs in our local state
        if (progressData && progressData.mcqProgress && progressData.mcqProgress.length > 0) {
          const completedMcqIds = progressData.mcqProgress
            .filter(p => p.completed)
            .map(p => getIdString(p.resourceId))
            .filter(id => id !== null);
          
          if (completedMcqIds.length > 0 && currentResources.length > 0) {
            const updatedResources = [...currentResources];
            
            // Mark all completed MCQs
            updatedResources.forEach((resource, index) => {
              if (resource.resourceType === 'MCQ' && 
                  completedMcqIds.includes(resource._id.toString())) {
                updatedResources[index] = {
                  ...updatedResources[index],
                  isCorrectlyAnswered: true
                };
              }
            });
            
            setResources(updatedResources);
          }
        }
        
        // After marking completed MCQs, navigate to the last accessed resource
        if (!initialLoadComplete && progressData && currentResources.length > 0) {
          navigateToLastAccessedResource(progressData, currentResources);
        }
      }
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoading(prev => ({ ...prev, progress: false }));
      setInitialLoadComplete(true);
    }
  };

  // Simplified navigation to last accessed resource
  const navigateToLastAccessedResource = (progressData, resourcesList = null) => {
    // Use the passed resources list or the current state
    const currentResources = resourcesList || resources;
    
    if (!progressData || !currentResources.length) return;
    
    // Try to find the last accessed resource
    const lastAccessedResourceId = getIdString(progressData.lastAccessedResource);
    
    if (lastAccessedResourceId) {
      const resourceIndex = currentResources.findIndex(
        r => r._id.toString() === lastAccessedResourceId
      );
      
      if (resourceIndex !== -1) {
        // Check if this is an MCQ and if it's completed
        const resource = currentResources[resourceIndex];
        if (resource.resourceType === 'MCQ') {
          // Find the MCQ progress for this resource
          const mcqProgress = progressData.mcqProgress.find(p => 
            getIdString(p.resourceId) === resource._id.toString()
          );
          
          if (mcqProgress && mcqProgress.completed) {
            // Mark as correctly answered in our local state
            const updatedResources = [...currentResources];
            updatedResources[resourceIndex] = {
              ...updatedResources[resourceIndex],
              isCorrectlyAnswered: true
            };
            setResources(updatedResources);
            setCurrentIndex(resourceIndex);
            return;
          }
        } else {
          // Not an MCQ, just navigate to it
          setCurrentIndex(resourceIndex);
          return;
        }
      }
    }
    
    // If no lastAccessedResource or it wasn't found, find the last completed MCQ
    if (progressData.mcqProgress && progressData.mcqProgress.length > 0) {
      // Get all completed MCQs
      const completedMcqs = progressData.mcqProgress
        .filter(p => p.completed)
        .map(p => getIdString(p.resourceId))
        .filter(id => id !== null);
      
      if (completedMcqs.length > 0) {
        // Find the index of the last completed MCQ in our resources array
        let lastCompletedIndex = -1;
        
        // Iterate through resources to find the last completed MCQ
        for (let i = 0; i < currentResources.length; i++) {
          const resource = currentResources[i];
          if (
            resource.resourceType === 'MCQ' && 
            completedMcqs.includes(resource._id.toString())
          ) {
            lastCompletedIndex = i;
            
            // Mark as correctly answered in our local state
            const updatedResources = [...currentResources];
            updatedResources[i] = {
              ...updatedResources[i],
              isCorrectlyAnswered: true
            };
            setResources(updatedResources);
          }
        }
        
        // If we found a completed MCQ, navigate to the next resource after it
        if (lastCompletedIndex !== -1 && lastCompletedIndex < currentResources.length - 1) {
          setCurrentIndex(lastCompletedIndex + 1);
          return;
        } else if (lastCompletedIndex !== -1) {
          // If it's the last resource, just navigate to it
          setCurrentIndex(lastCompletedIndex);
          return;
        }
      }
    }
    
    // If no completed MCQs found, start from the beginning
    setCurrentIndex(0);
  };

  // Get current MCQ progress
  const getCurrentMcqProgress = () => {
    if (!progress.studentProgress || !resources[currentIndex]) return null;
    
    return progress.studentProgress.mcqProgress.find(p => 
      getIdString(p.resourceId) === resources[currentIndex]._id.toString()
    );
  };

  // Function to refresh signed URLs
  const refreshSignedUrls = async (resourcesList) => {
    setLoading(prev => ({ ...prev, urls: true }));
    try {
      const newUrls = {};
      for (const resource of resourcesList) {
        const resourceUrls = await fetchSignedUrls(resource);
        Object.assign(newUrls, resourceUrls);
      }
      setSignedUrls(newUrls);
    } catch (error) {
      console.error('Error refreshing signed URLs:', error);
    } finally {
      setLoading(prev => ({ ...prev, urls: false }));
    }
  };

  // Check section completion
  const checkSectionCompletion = async () => {
    if (!user?.studentId) return;
    
    try {
      const response = await getData(`section-unlock/check-completion/${user.studentId}/${courseId}/${unitId}/${sectionId}`);
      return response.status === 200 && response.data.isCompleted;
    } catch (error) {
      console.error('Error checking section completion:', error);
      return false;
    }
  };

  // MCQ completion handler
  const handleMcqCompleted = async (resourceId, isCorrect, attempts) => {
    if (!user?.studentId || !isCorrect) return;
    
    try {
      // Mark the resource as correctly answered in our local state
      const updatedResources = [...resources];
      const resourceIndex = updatedResources.findIndex(r => r._id === resourceId);
      
      if (resourceIndex >= 0) {
        updatedResources[resourceIndex] = {
          ...updatedResources[resourceIndex],
          isCorrectlyAnswered: true
        };
        setResources(updatedResources);
      }
      
      // Check if all MCQs in the section are completed
      await checkSectionCompletion();
    } catch (error) {
      console.error('Error updating MCQ progress:', error);
    }
  };

  // MCQ completion check
  const isCurrentMcqCompleted = () => {
    if (!resources[currentIndex] || resources[currentIndex].resourceType !== 'MCQ') {
      return true; // Not an MCQ, so navigation is allowed
    }
    
    const currentResource = resources[currentIndex];
    
    // Check if the resource is marked as correctly answered in our local state
    if (currentResource.isCorrectlyAnswered === true) {
      return true;
    }
    
    // Also check the mcqProgress data from the server
    if (progress.studentProgress && progress.studentProgress.mcqProgress) {
      const mcqProgress = progress.studentProgress.mcqProgress.find(
        p => getIdString(p.resourceId) === currentResource._id.toString()
      );
      
      if (mcqProgress && mcqProgress.completed) {
        // If we find it's completed in the progress data but not marked locally,
        // update our local state
        const updatedResources = [...resources];
        updatedResources[currentIndex] = {
          ...updatedResources[currentIndex],
          isCorrectlyAnswered: true
        };
        setResources(updatedResources);
        return true;
      }
    }
    
    return false;
  };

  if (loading.resources || resources.length === 0) {
    return (
      <Paper
        elevation={5}
        sx={{
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          width: '100%',
          bgcolor: 'background.paper',
          flexDirection: 'column'
        }}
      >
        <CircularProgress
          size={180}
          thickness={3}
          sx={{
            color: 'primary.main',
            mb: 3
          }}
        />
        <Typography variant='h5'>Loading Learner's Frame</Typography>
      </Paper>
    );
  }

  return (
    <Grid container>
      <Grid size={12}>
        <Paper elevation={5} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Box sx={{ 
            p: 1, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content'
              }}
              onClick={() => navigate(`/units/${courseId}/section/${unitId}`)}
            >
              <ChevronLeft sx={{ color: 'primary.main' }} /> Back To Section
            </Typography>
            
            {/* Section Viewed percentage moved here */}
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              Section Viewed: {Math.round(progress.section)}%
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Resource Title Bar */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='h6' sx={{ mr: 1 }}>
                  {resources[currentIndex]?.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  color='inherit'
                  size='small'
                  disabled={currentIndex === 0}
                  onClick={handlePrevious}
                  sx={{
                    minWidth: '36px',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant='contained'
                  color='inherit'
                  size='small'
                  disabled={
                    currentIndex === resources.length - 1 ||
                    (resources[currentIndex]?.resourceType === 'MCQ' &&
                      !isCurrentMcqCompleted())
                  }
                  onClick={handleNext}
                  sx={{
                    minWidth: '36px',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  <ChevronRight />
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ bgcolor: 'white' }}>
            {resources[currentIndex] && (
              <ResourceRenderer
                key={`resource-${resources[currentIndex]._id}-${currentIndex}`}
                resource={resources[currentIndex]}
                signedUrl={signedUrls[resources[currentIndex]?.content?.fileName]}
                signedUrls={signedUrls}
                onMcqCompleted={handleMcqCompleted}
                mcqProgress={getCurrentMcqProgress()}
                onNext={handleNext}
                isLastResource={currentIndex === resources.length - 1}
                studentId={user?.studentId}
                courseId={courseId}
                unitId={unitId}
                sectionId={sectionId}
              />
            )}
          </Box>

          <Box sx={{ px: 2, py: 2, borderTop: '1px solid #f0f0f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant='body2' fontWeight="medium">
                Your Progress (MCQs): {progress.mcq}%
              </Typography>
              <Typography variant='body2' color="text.secondary">
                {progress.completedMcqs} of {progress.totalMcqs} MCQs completed
              </Typography>
            </Box>
            <LinearProgress 
              variant='determinate' 
              value={progress.mcq} 
              sx={{ 
                height: 8,  // Thickened progress bar
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: 'success.main',
                  borderRadius: 4
                } 
              }} 
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LearnerFrame