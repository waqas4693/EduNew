import Grid from '@mui/material/Grid2'
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  NavigateNext
} from '@mui/icons-material'
import { getData, postData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const formatExternalUrl = url => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

const ResourceRenderer = ({ 
  resource, 
  signedUrl, 
  signedUrls, 
  onMcqCompleted, 
  mcqProgress,
  onNext,
  isLastResource
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [attempts, setAttempts] = useState(mcqProgress?.attempts || 0)
  const audioRef = useRef(null)
  const mcqAudioRef = useRef(null)
  const [playCount, setPlayCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (resource.resourceType === 'AUDIO' && audioRef.current) {
      const audio = audioRef.current
      const repeatCount = resource.content.repeatCount

      const handleEnded = () => {
        setPlayCount(prev => {
          const newCount = prev + 1
          if (newCount <= repeatCount) {
            setTimeout(() => {
              audio.currentTime = 0
              audio.play()
            }, 0)
            return newCount
          }
          setIsPlaying(false)
          return 0
        })
      }

      const handlePlay = () => {
        if (!isPlaying) {
          setPlayCount(1)
          setIsPlaying(true)
        }
      }

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('play', handlePlay)

      return () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('play', handlePlay)
      }
    }
  }, [resource, isPlaying])

  const handleAnswerSelect = option => {
    if (hasSubmitted) return

    setSelectedAnswers(prev => {
      const currentAnswers = [...prev]
      const index = currentAnswers.indexOf(option)

      if (
        index === -1 &&
        currentAnswers.length < resource.content.mcq.numberOfCorrectAnswers
      ) {
        return [...currentAnswers, option]
      } else if (index !== -1) {
        return currentAnswers.filter(ans => ans !== option)
      }
      return currentAnswers
    })
  }

  const handleSubmit = () => {
    if (
      selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers
    ) {
      alert(
        `Please select ${resource.content.mcq.numberOfCorrectAnswers} answer(s)`
      )
      return
    }

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    const isAnswerCorrect =
      selectedAnswers.length === resource.content.mcq.correctAnswers.length &&
      selectedAnswers.every(answer =>
        resource.content.mcq.correctAnswers.includes(answer)
      )

    setIsCorrect(isAnswerCorrect)
    setHasSubmitted(true)

    // Call the callback to update progress in the parent component
    onMcqCompleted(resource._id, isAnswerCorrect, newAttempts)
  }

  const handleReset = () => {
    setSelectedAnswers([])
    setHasSubmitted(false)
    setIsCorrect(false)
  }

  const getOptionStyle = option => {
    if (!hasSubmitted) {
      return {
        border: selectedAnswers.includes(option)
          ? '2px solid #3366CC'
          : '1px solid #ddd'
      }
    }

    const isSelected = selectedAnswers.includes(option)
    const isCorrectOption = resource.content.mcq.correctAnswers.includes(option)

    if (isCorrect) {
      if (isCorrectOption) {
        return { bgcolor: '#4CAF50', color: 'white' }
      }
    } else {
      if (isSelected) {
        return { bgcolor: '#f44336', color: 'white' }
      }
    }
    
    return { border: '1px solid #ddd' }
  }

  const renderMCQ = () => {
    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    if (mcqProgress?.completed && !hasSubmitted) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
            {resource.content.mcq.question}
          </Typography>

          {/* MCQ Image */}
          {resource.content.mcq?.imageFile && signedUrls[resource.content.mcq.imageFile] && (
            <Box sx={{ mb: 2, maxWidth: '100%', overflow: 'hidden' }}>
              <img
                src={signedUrls[resource.content.mcq.imageFile]}
                alt="Question"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          )}

          {/* MCQ Audio Player */}
          {resource.content.mcq?.audioFile && signedUrls[resource.content.mcq.audioFile] && (
            <Box sx={{ mb: 2 }}>
              <audio
                ref={mcqAudioRef}
                controls
                style={{ width: '100%' }}
                src={signedUrls[resource.content.mcq.audioFile]}
              >
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}

          <Alert severity="success" sx={{ mb: 2 }}>
            You have already completed this MCQ correctly! You can proceed to the next one.
          </Alert>
          
          {/* Options with correct answers highlighted */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {resource.content.mcq.options.map((option, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  bgcolor: resource.content.mcq.correctAnswers.includes(option)
                    ? 'success.main'  // Stronger green color for correct answers
                    : 'white',
                  color: resource.content.mcq.correctAnswers.includes(option)
                    ? 'white'
                    : 'inherit',
                }}
              >
                <Typography>{`${alphabet[index]}. ${option}`}</Typography>
              </Paper>
            ))}
          </Box>
          
          {/* Next button for already completed MCQs */}
          {!isLastResource && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<NavigateNext />}
              onClick={onNext}
              sx={{ mt: 2 }}
            >
              Next
            </Button>
          )}
        </Box>
      );
    }
    
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
          {resource.content.mcq.question}
        </Typography>

        {resource.content.mcq?.imageFile && signedUrls[resource.content.mcq.imageFile] && (
          <Box sx={{ mb: 2, maxWidth: '100%', overflow: 'hidden' }}>
            <img
              src={signedUrls[resource.content.mcq.imageFile]}
              alt="Question"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        )}

        {resource.content.mcq?.audioFile && signedUrls[resource.content.mcq.audioFile] && (
          <Box sx={{ mb: 2 }}>
            <audio
              ref={mcqAudioRef}
              controls
              style={{ width: '100%' }}
              src={signedUrls[resource.content.mcq.audioFile]}
            >
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}

        {attempts > 0 && (
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Attempts: {attempts}
          </Typography>
        )}

        {/* Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {resource.content.mcq.options.map((option, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                cursor: hasSubmitted ? 'default' : 'pointer',
                ...getOptionStyle(option),
                '&:hover': {
                  bgcolor: hasSubmitted 
                    ? getOptionStyle(option).bgcolor || 'white'
                    : '#f5f5f5'
                }
              }}
              onClick={() => handleAnswerSelect(option)}
            >
              <Typography>{`${alphabet[index]}. ${option}`}</Typography>
            </Paper>
          ))}
        </Box>

        {!hasSubmitted ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            disabled={selectedAnswers.length !== resource.content.mcq.numberOfCorrectAnswers}
          >
            Submit
          </Button>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity={isCorrect ? 'success' : 'error'}>
              {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
            </Alert>
            
            {/* Show Next button if answer is correct and not the last resource */}
            {isCorrect && !isLastResource ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<NavigateNext />}
                onClick={onNext}
                sx={{ mt: 1 }}
              >
                Next
              </Button>
            ) : (
              /* Only show Try Again button if the answer was incorrect */
              !isCorrect && (
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ mt: 1 }}
                >
                  Try Again
                </Button>
              )
            )}
          </Box>
        )}
      </Box>
    );
  }

  switch (resource.resourceType) {
    case 'VIDEO':
      return (
        <Box sx={{ position: 'relative', width: '100%', height: '80vh' }}>
          <video
            controls
            controlsList="nodownload"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
            src={signedUrl}
          />
        </Box>
      )

    case 'IMAGE':
      return (
        <Box
          sx={{
            width: '100%',
            height: '70vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <img
            src={signedUrl}
            alt={resource.name}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      )

    case 'TEXT':
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: 3
          }}
        >
          {/* Background Image */}
          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '100%',
                height: '40vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt='Background'
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}

          {/* Questions and Answers */}
          <Box sx={{ width: '100%' }}>
            {resource.content.questions.map((qa, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:before': {
                    display: 'none'
                  },
                  borderRadius: '8px !important',
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    bgcolor: 'grey.200',
                    '& .MuiAccordionSummary-expandIconWrapper': {
                    },
                    '& .MuiAccordionSummary-content': {
                      overflow: 'hidden'
                    }
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {qa.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    backgroundColor: 'background.paper',
                    p: 3
                  }}
                >
                  <Typography
                    variant='body1'
                    sx={{
                      color: 'text.primary',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {qa.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      )

    case 'MCQ':
      return renderMCQ()

    case 'AUDIO':
      return (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              m: 1,
              p: 1,
              display: 'flex',
              bgcolor: '#f5f5f5',
              borderRadius: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2
            }}
          >
            <audio
              controls
              ref={audioRef}
              src={signedUrl}
              style={{ width: '100%', maxWidth: '600px' }}
            />
            {playCount > 0 && (
              <Typography
                variant='body1'
                sx={{
                  color: 'primary.white',
                  fontWeight: 'medium',
                  minWidth: '30px',
                  textAlign: 'center',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'primary.light'
                }}
              >
                {resource.content.repeatCount - playCount + 1}
              </Typography>
            )}
          </Box>

          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt={resource.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </Box>
      )

    case 'PPT':
      return (
        <Box
          sx={{
            p: 2,
            gap: 2,
            width: '100%',
            height: '80vh',
            display: 'flex',
            flexDirection: 'row'
          }}
        >
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
            style={{
              width: '50%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            title='PowerPoint Presentation'
            allowFullScreen
          />
          {resource.content.backgroundImage && (
            <Box
              sx={{
                width: '50%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
              }}
            >
              <img
                src={signedUrls[resource.content.backgroundImage]}
                alt="Presentation Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}
        </Box>
      )

    case 'PDF':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          {/* PDF Viewer */}

          <Typography variant="h6">Checking The Data Of Pdf Res With Audio {resource.content.audioFile}</Typography>
            

          <Box sx={{ width: '100%', height: '70vh' }}>
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              title="PDF Viewer"
            />
          </Box>

          {/* Audio Player for PDF */}
          {resource.content.audioFile && signedUrls[resource.content.audioFile] && (
            <Box sx={{ 
              width: '100%', 
              p: 2, 
              bgcolor: 'grey.100', 
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Audio Narration
              </Typography>
              <audio
                controls
                style={{ width: '100%' }}
                src={signedUrls[resource.content.audioFile]}
              >
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}
        </Box>
      )

    default:
      return (
        <Box
          sx={{
            width: '100%',
            height: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography>Unsupported resource type</Typography>
        </Box>
      )
  }
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
      console.log('Fetching signed URLs for resource:', resource);
      console.log('Resource type:', resource.resourceType);
      console.log('Resource content:', resource.content);

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
        console.log('Found PDF audio file:', resource.content.audioFile);
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

      console.log('Final signed URLs:', urls);
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
        
        console.log('Resources received from server:', newResources);
        
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
          console.log('Processing resource:', resource);
          console.log('Resource content:', resource.content);
          const resourceUrls = await fetchSignedUrls(resource);
          console.log('Signed URLs for resource:', resourceUrls);
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

  // Add function to load more resources
  const loadMoreResources = () => {
    if (pagination.hasMore && !loading.resources) {
      fetchResources(pagination.page + 1);
    }
  };

  // Modify useEffect to reset pagination when section changes
  useEffect(() => {
    setPagination({
      page: 1,
      total: 0,
      totalPages: 0,
      hasMore: true
    });
    fetchResources(1);
  }, [sectionId]);

  // Add intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !loading.resources) {
          loadMoreResources();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [pagination.hasMore, loading.resources]);

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

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (urlRefreshTimer) {
        clearInterval(urlRefreshTimer);
      }
    };
  }, [urlRefreshTimer]);

  // Load main resource content only when clicked
  useEffect(() => {
    const fetchResourceContent = async () => {
      if (!resources[currentIndex]) return;
      
      const resource = resources[currentIndex];
      const urlsToFetch = [];
      
      // Determine which URLs need to be fetched
      if (resource.resourceType === 'MCQ') {
        if (resource.content.mcq?.imageFile && !signedUrls[resource.content.mcq.imageFile]) {
          urlsToFetch.push({
            key: resource.content.mcq.imageFile,
            fileName: resource.content.mcq.imageFile,
            folder: 'MCQ_IMAGES'
          });
        }
        
        if (resource.content.mcq?.audioFile && !signedUrls[resource.content.mcq.audioFile]) {
          urlsToFetch.push({
            key: resource.content.mcq.audioFile,
            fileName: resource.content.mcq.audioFile,
            folder: 'MCQ_AUDIO'
          });
        }
      }

      // Main resource content
      if (resource.content.fileName && !signedUrls[resource.content.fileName]) {
        urlsToFetch.push({
          key: resource.content.fileName,
          fileName: resource.content.fileName,
          folder: resource.resourceType
        });
      }

      // Background images
      if ((resource.resourceType === 'AUDIO' || resource.resourceType === 'TEXT' || 
           resource.resourceType === 'PPT') && 
          resource.content.backgroundImage && 
          !signedUrls[resource.content.backgroundImage]) {
        urlsToFetch.push({
          key: resource.content.backgroundImage,
          fileName: resource.content.backgroundImage,
          folder: 'BACKGROUNDS'
        });
      }

      // PPT preview images
      if (resource.resourceType === 'PPT' && 
          resource.content.previewImageUrl && 
          !signedUrls[resource.content.previewImageUrl]) {
        urlsToFetch.push({
          key: resource.content.previewImageUrl,
          fileName: resource.content.previewImageUrl,
          folder: 'PPT'
        });
      }
      
      // Fetch all needed URLs in parallel
      if (urlsToFetch.length > 0) {
        setLoading(prev => ({ ...prev, urls: true }));
        try {
          const results = await Promise.all(
            urlsToFetch.map(item => 
              getSignedS3Url(item.fileName, item.folder)
                .then(url => ({ key: item.key, url }))
            )
          );
          
          const newUrls = { ...signedUrls };
          results.forEach(result => {
            if (result.url) {
              newUrls[result.key] = result.url;
            }
          });
          
          setSignedUrls(newUrls);
        } catch (error) {
          console.error('Error fetching resource content:', error);
        } finally {
          setLoading(prev => ({ ...prev, urls: false }));
        }
      }
    };

    fetchResourceContent();
  }, [currentIndex, resources]);

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

  // Optimized navigation handlers
  const handleNext = () => {
    if (currentIndex < resources.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
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

  // Optimized MCQ completion handler
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
      
      // Update the progress on the server
      await postData(`student-progress/${user.studentId}/${courseId}/${unitId}/${sectionId}/${resourceId}`, {
        completed: true,
        attempts
      });
      
      // Also update this as the last accessed resource
      await updateLastAccessedResource(resourceId);
      
      // Refresh all progress data
      await fetchStudentProgress();
      
      // Check if all MCQs in the section are completed
      await checkSectionCompletion();
    } catch (error) {
      console.error('Error updating MCQ progress:', error);
    }
  };

  // Optimized MCQ completion check
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

  // Determine if we should show loading state
  const isPageLoading = loading.resources || (resources.length === 0);

  if (isPageLoading) {
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
              />
            )}
          </Box>

          {/* Load More Trigger */}
          {pagination.hasMore && (
            <Box
              id="load-more-trigger"
              sx={{
                height: '20px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 2
              }}
            >
              {loading.resources && <CircularProgress size={24} />}
            </Box>
          )}

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