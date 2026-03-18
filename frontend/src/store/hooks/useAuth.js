import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout, setCredentials } from '../slices/authSlice'

const useAuth = () => {
	const dispatch = useDispatch()
	const auth = useSelector((state) => state.auth)

	return useMemo(
		() => ({
			...auth,
			setAuth: (payload) => dispatch(setCredentials(payload)),
			clearAuth: () => dispatch(logout())
		}),
		[auth, dispatch]
	)
}

export default useAuth
