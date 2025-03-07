import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Login from './components/Login';
import Signup from './components/Signup';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

class App extends React.Component {
  handleLogout = () => {
    this.props.dispatch({ type: 'LOGOUT' });
  };

  render() {
    const { token } = this.props;
    return (
      <Router>
        <nav className="bg-blue-600 p-4 text-white shadow-lg fixed top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="w-20" />
            <Link to="/" className="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">Ticketing System</Link>
            {token && (
              <button
                onClick={this.handleLogout}
                className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            )}
          </div>
        </nav>
        <div className="min-h-screen bg-gray-50 pt-16">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    );
  }
}

const mapStateToProps = (state) => ({ token: state.token });
export default connect(mapStateToProps)(App);