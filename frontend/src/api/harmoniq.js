import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
})

export const fetchStems = (filters = {}) =>
  api.get('/api/stems', { params: filters }).then((r) => r.data)

export const fetchStem = (id) =>
  api.get(`/api/stems/${id}`).then((r) => r.data)

export const fetchPopularStems = () =>
  api.get('/api/stems/popular').then((r) => r.data)

export const createStem = (data) =>
  api.post('/api/stems', data).then((r) => r.data)

export const mintStem = (id) =>
  api.post(`/api/stems/${id}/mint`).then((r) => r.data)

export const fetchTracks = (filters = {}) =>
  api.get('/api/tracks', { params: filters }).then((r) => r.data)

export const fetchTrack = (id) =>
  api.get(`/api/tracks/${id}`).then((r) => r.data)

export const createTrack = (data) =>
  api.post('/api/tracks', data).then((r) => r.data)

export const fetchProducers = () =>
  api.get('/api/producers').then((r) => r.data)

export const registerProducer = (data) =>
  api.post('/api/producers', data).then((r) => r.data)

export const recordLicense = (data) =>
  api.post('/api/licenses', data).then((r) => r.data)

export const fetchStemLicenses = (stemId) =>
  api.get(`/api/licenses/stem/${stemId}`).then((r) => r.data)

export const fetchBuyerLicenses = (buyerId) =>
  api.get(`/api/licenses/buyer/${buyerId}`).then((r) => r.data)

export const setRoyaltySplits = (trackId, splits) =>
  api.post(`/api/royalties/track/${trackId}`, { splits }).then((r) => r.data)

export const fetchRoyaltySplits = (trackId) =>
  api.get(`/api/royalties/track/${trackId}`).then((r) => r.data)

export const distributeRoyalties = (trackId, data) =>
  api.post(`/api/royalties/distribute/${trackId}`, data).then((r) => r.data)

export const addReview = (data) =>
  api.post('/api/reviews', data).then((r) => r.data)

export const fetchStemReviews = (stemId) =>
  api.get(`/api/reviews/stem/${stemId}`).then((r) => r.data)

export const fetchLeaderboard = () =>
  api.get('/api/reviews/leaderboard').then((r) => r.data)
