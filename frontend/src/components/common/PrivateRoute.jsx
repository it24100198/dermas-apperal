import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" />
  }

  return children
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
}

export default PrivateRoute