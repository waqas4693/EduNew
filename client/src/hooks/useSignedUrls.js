import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getData } from '../api/api'

const URL_EXPIRATION_TIME = 45 * 60 * 1000 // 45 minutes

const fetchSignedUrl = async ({ fileName, folder }) => {
  const response = await getData(`resources/files/url/${folder}/${fileName}`)
  return {
    url: response.data.signedUrl,
    expiresAt: Date.now() + URL_EXPIRATION_TIME
  }
}

export const useSignedUrls = (resource) => {
  const queryClient = useQueryClient()

  // Fetch main resource URL
  const mainUrlQuery = useQuery({
    queryKey: ['signedUrl', resource.content.fileName, resource.resourceType],
    queryFn: () => fetchSignedUrl({
      fileName: resource.content.fileName,
      folder: resource.resourceType
    }),
    enabled: !!resource.content.fileName,
    staleTime: URL_EXPIRATION_TIME,
    cacheTime: URL_EXPIRATION_TIME * 2,
  })

  // Fetch background image URL
  const backgroundUrlQuery = useQuery({
    queryKey: ['signedUrl', resource.content.backgroundImage, 'BACKGROUNDS'],
    queryFn: () => fetchSignedUrl({
      fileName: resource.content.backgroundImage,
      folder: 'BACKGROUNDS'
    }),
    enabled: !!resource.content.backgroundImage,
    staleTime: URL_EXPIRATION_TIME,
    cacheTime: URL_EXPIRATION_TIME * 2,
  })

  // Fetch PDF audio URL
  const pdfAudioUrlQuery = useQuery({
    queryKey: ['signedUrl', resource.content.audioFile, 'AUDIO'],
    queryFn: () => fetchSignedUrl({
      fileName: resource.content.audioFile,
      folder: 'AUDIO'
    }),
    enabled: resource.resourceType === 'PDF' && !!resource.content.audioFile,
    staleTime: URL_EXPIRATION_TIME,
    cacheTime: URL_EXPIRATION_TIME * 2,
  })

  // Fetch MCQ related URLs
  const mcqImageUrlQuery = useQuery({
    queryKey: ['signedUrl', resource.content.mcq?.imageFile, 'MCQ_IMAGES'],
    queryFn: () => fetchSignedUrl({
      fileName: resource.content.mcq.imageFile,
      folder: 'MCQ_IMAGES'
    }),
    enabled: resource.resourceType === 'MCQ' && !!resource.content.mcq?.imageFile,
    staleTime: URL_EXPIRATION_TIME,
    cacheTime: URL_EXPIRATION_TIME * 2,
  })

  const mcqAudioUrlQuery = useQuery({
    queryKey: ['signedUrl', resource.content.mcq?.audioFile, 'MCQ_AUDIO'],
    queryFn: () => fetchSignedUrl({
      fileName: resource.content.mcq.audioFile,
      folder: 'MCQ_AUDIO'
    }),
    enabled: resource.resourceType === 'MCQ' && !!resource.content.mcq?.audioFile,
    staleTime: URL_EXPIRATION_TIME,
    cacheTime: URL_EXPIRATION_TIME * 2,
  })

  // Combine all URLs
  const signedUrls = {
    [resource.content.fileName]: mainUrlQuery.data?.url,
    [resource.content.backgroundImage]: backgroundUrlQuery.data?.url,
    [resource.content.audioFile]: pdfAudioUrlQuery.data?.url,
    [resource.content.mcq?.imageFile]: mcqImageUrlQuery.data?.url,
    [resource.content.mcq?.audioFile]: mcqAudioUrlQuery.data?.url,
  }

  // Check if any URLs are expired
  const isAnyUrlExpired = [
    mainUrlQuery.data?.expiresAt,
    backgroundUrlQuery.data?.expiresAt,
    pdfAudioUrlQuery.data?.expiresAt,
    mcqImageUrlQuery.data?.expiresAt,
    mcqAudioUrlQuery.data?.expiresAt,
  ].some(expiresAt => expiresAt && expiresAt < Date.now())

  // Refresh expired URLs
  const refreshExpiredUrls = () => {
    if (isAnyUrlExpired) {
      queryClient.invalidateQueries(['signedUrl'])
    }
  }

  return {
    signedUrls,
    isLoading: mainUrlQuery.isLoading || backgroundUrlQuery.isLoading || 
               pdfAudioUrlQuery.isLoading || mcqImageUrlQuery.isLoading || 
               mcqAudioUrlQuery.isLoading,
    isError: mainUrlQuery.isError || backgroundUrlQuery.isError || 
             pdfAudioUrlQuery.isError || mcqImageUrlQuery.isError || 
             mcqAudioUrlQuery.isError,
    error: mainUrlQuery.error || backgroundUrlQuery.error || 
           pdfAudioUrlQuery.error || mcqImageUrlQuery.error || 
           mcqAudioUrlQuery.error,
    refreshExpiredUrls
  }
} 