import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './context/ToastContext'
import Header from './components/Header'; import Footer from './components/Footer'; import AuthModal from './components/AuthModal'
import Home from './pages/Home'; import ListingDetail from './pages/ListingDetail'; import Trips from './pages/Trips'; import Wishlists from './pages/Wishlists'
export default function App() {
  return <BrowserRouter><ToastProvider><AuthProvider><WishlistProvider>
    <div className="flex min-h-screen flex-col"><Header />
      <div className="flex-1"><Routes>
        <Route path="/" element={<Home />} /><Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/trips" element={<Trips />} /><Route path="/wishlists" element={<Wishlists />} />
        <Route path="*" element={<div className="py-32 text-center text-lg">Page not found.</div>} />
      </Routes></div><Footer /></div>
    <AuthModal />
  </WishlistProvider></AuthProvider></ToastProvider></BrowserRouter>
}
