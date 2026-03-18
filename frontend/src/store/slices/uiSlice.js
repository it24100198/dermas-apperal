import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	isSidebarOpen: false,
	globalLoading: false
}

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		openSidebar: (state) => {
			state.isSidebarOpen = true
		},
		closeSidebar: (state) => {
			state.isSidebarOpen = false
		},
		toggleSidebar: (state) => {
			state.isSidebarOpen = !state.isSidebarOpen
		},
		setGlobalLoading: (state, action) => {
			state.globalLoading = Boolean(action.payload)
		}
	}
})

export const { openSidebar, closeSidebar, toggleSidebar, setGlobalLoading } = uiSlice.actions
export default uiSlice.reducer
