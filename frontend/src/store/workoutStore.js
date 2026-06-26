// workoutStore.js — Global session state using useReducer


export const initialState = {
  repCount:        0,
  formScore:       100,
  lastCue:         '',
  sessionActive:   false,
  sessionId:       null,
  wsStatus:        'disconnected',
  coachingText:    '',
  coachingLoading: false,
  selectedExercise: 'squat',
}

export const Actions = {
  SET_REP_COUNT:       'SET_REP_COUNT',
  SET_FORM_SCORE:      'SET_FORM_SCORE',
  SET_CUE:             'SET_CUE',
  SET_SESSION_ACTIVE:  'SET_SESSION_ACTIVE',
  SET_SESSION_ID:      'SET_SESSION_ID',
  SET_WS_STATUS:       'SET_WS_STATUS',
  SET_COACHING_TEXT:   'SET_COACHING_TEXT',
  SET_COACHING_LOADING:'SET_COACHING_LOADING',
  SET_EXERCISE:         'SET_EXERCISE',
}

export function workoutReducer(state, action) {
  switch (action.type) {
    case Actions.SET_REP_COUNT:       return { ...state, repCount: action.payload }
    case Actions.SET_FORM_SCORE:      return { ...state, formScore: action.payload }
    case Actions.SET_CUE:             return { ...state, lastCue: action.payload }
    case Actions.SET_SESSION_ACTIVE:  return { ...state, sessionActive: action.payload }
    case Actions.SET_SESSION_ID:      return { ...state, sessionId: action.payload }
    case Actions.SET_WS_STATUS:       return { ...state, wsStatus: action.payload }
    case Actions.SET_COACHING_TEXT:   return { ...state, coachingText: action.payload }
    case Actions.SET_COACHING_LOADING:return { ...state, coachingLoading: action.payload }
    case Actions.SET_EXERCISE:        return { ...state, selectedExercise: action.payload } 
    default:                          return state
  }
}