import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HostedListings from './pages/HostedListings';
import Login from './pages/Login';
import Register from './pages/Register';
import Site from './pages/Site';
import CreateListing from './pages/CreateListing';
import ViewListing from './pages/ViewListing';
import EditListing from './pages/EditListing';
import BookedListings from './pages/BookedListings';
import Bookings from './pages/Bookings';
import Reviews from './pages/Reviews';
import ViewProfile from './pages/ViewProfile';
import EditProfile from './pages/EditProfile';
import PuzzlePage from './pages/PuzzlePage';
import Admin from './pages/Admin';
import Badge from './pages/Badge';

const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/badge" element={<Badge />} />
      <Route path="/register" element={<Register />} />
      <Route path="/puzzles/:date" element={<PuzzlePage />} />
      <Route path="/hosted_listings" element={<HostedListings />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/booked_listings" element={<BookedListings />} />
      <Route path="/create_listing" element={<CreateListing />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/reviews/:listing_id" element={<Reviews />} />
      <Route path="/edit_listing/:listing_id" element={<EditListing />} />
      <Route path="/view_listing/:listing_id" element={<ViewListing />} />
      <Route path="/view_profile/:user_id" element={<ViewProfile />} />
      <Route path="/edit_profile/:user_id" element={<EditProfile />} />
      <Route path="/" element={<Site />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default Router;
