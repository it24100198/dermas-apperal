import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	filters: {
		status: '',
		category: '',
		department: '',
		startDate: '',
		endDate: ''
	},
	selectedExpense: null
}

const expenseSlice = createSlice({
	name: 'expenses',
	initialState,
	reducers: {
		setExpenseFilters: (state, action) => {
			state.filters = {
				...state.filters,
				...action.payload
			}
		},
		resetExpenseFilters: (state) => {
			state.filters = initialState.filters
		},
		setSelectedExpense: (state, action) => {
			state.selectedExpense = action.payload
		},
		clearSelectedExpense: (state) => {
			state.selectedExpense = null
		}
	}
})

export const {
	setExpenseFilters,
	resetExpenseFilters,
	setSelectedExpense,
	clearSelectedExpense
} = expenseSlice.actions

export default expenseSlice.reducer
