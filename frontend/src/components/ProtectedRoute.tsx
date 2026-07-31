import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  
  // If there is no token, kick them back to the login page
  if (!token) {
    return ;
  }
  
  return children;
}