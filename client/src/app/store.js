import { configureStore } from '@reduxjs/toolkit'
import workspaceReducer from '../features/workspaceSlice'
import themeReducer from '../features/themeSlice'
import authReducer from '../features/authSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        workspace: workspaceReducer,
        theme: themeReducer,
    },
})