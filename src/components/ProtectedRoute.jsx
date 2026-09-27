import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2563EB] rounded-full animate-spin"></div>
          <div className="text-sm text-slate-500 font-semibold">Loading EduCore...</div>
        </div>
      </div>);
    }
    if (!user)
        return <Navigate to="/login" replace/>;
    return <>{children}</>;
}
