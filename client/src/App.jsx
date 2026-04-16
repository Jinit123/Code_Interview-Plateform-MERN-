import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InterviewRoom from './pages/InterviewRoom'
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from './components/ProtectedRoutes'

function App() {

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Login />}></Route>
          <Route path='/register' element={<Register />}></Route>
          <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>}></Route>
          <Route path='/room/:roomId' element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
