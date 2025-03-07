import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

class Signup extends React.Component {
  state = { 
    firstName: '', 
    lastName: '', 
    email: '', 
    phoneNumber: '', 
    password: '', 
    confirmPassword: '', 
    role: 'user', 
    errors: {},
    serverError: '',
    loading: false,
    adminExists: false,
    loadingAdminCheck: true
  };

  componentDidMount() {
    this.checkAdminExists();
  }

  checkAdminExists = async () => {
    const startTime = Date.now();
    try {
      const res = await axios.get('http://localhost:5000/api/auth/admin-exists'); 
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);
      setTimeout(() => {
        this.setState({ adminExists: res.data.exists, loadingAdminCheck: false });
      }, remainingTime);
    } catch (err) {
      console.error('Failed to check admin existence:', err.response?.data.msg || err.message);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);
      setTimeout(() => {
        this.setState({ adminExists: true, loadingAdminCheck: false });
      }, remainingTime);
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, phoneNumber, password, confirmPassword, role } = this.state;
    let errors = {};

    if (!firstName) errors.firstName = 'First name cannot be empty';
    if (!lastName) errors.lastName = 'Last name cannot be empty';
    if (!email) errors.email = 'Email cannot be empty';
    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number cannot be empty';
    } else if (!/^\+\d{7,15}$/.test(phoneNumber)) { // Align with backend's 1-4 + 6-14
      errors.phoneNumber = 'Invalid phone number format (e.g., +12025550123)';
    }
    if (!password) errors.password = 'Password cannot be empty';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (password && confirmPassword && password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      this.setState({ errors, serverError: '' });
      return;
    }

    this.setState({ loading: true, errors: {}, serverError: '' });
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', { // Updated endpoint
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        confirmPassword, // Added to match backend
        role
      });
      const { token } = res.data;
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.props.dispatch({ 
        type: 'SET_AUTH', 
        token, 
        role: decoded.role, 
        email,
        firstName: decoded.firstName,
        lastName: decoded.lastName
      });
    } catch (err) {
      console.log('Signup error:', err.response?.data); // Log for debugging
      const serverErrors = err.response?.data.errors || [{ msg: err.response?.data.msg || 'Signup failed' }];
      const newErrors = {};
      serverErrors.forEach(error => {
        if (error.msg.includes('email')) newErrors.email = error.msg;
        else if (error.msg.includes('password')) newErrors.password = error.msg;
        else if (error.msg.includes('phone')) newErrors.phoneNumber = error.msg;
        else if (error.msg.includes('firstName')) newErrors.firstName = error.msg;
        else if (error.msg.includes('lastName')) newErrors.lastName = error.msg;
        else if (error.msg.includes('admin')) newErrors.server = error.msg;
        else newErrors.server = error.msg;
      });
      this.setState({ errors: newErrors, serverError: newErrors.server || '', loading: false });
    }
  };

  render() {
    const { token, role } = this.props;
    if (token) return role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/user-dashboard" />;

    const { firstName, lastName, email, phoneNumber, password, confirmPassword, errors, serverError, loading, adminExists, loadingAdminCheck } = this.state;

    if (loadingAdminCheck) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center space-y-4 w-64">
            <svg 
              className="animate-spin h-10 w-10 text-blue-600" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-700 text-lg font-semibold">Loading Signup...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <form onSubmit={this.handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold text-center text-gray-800">Sign Up</h2>
          {serverError && (
            <p className="text-red-600 text-center bg-red-100 p-2 rounded">{serverError}</p>
          )}
          <div>
            <input
              value={firstName}
              onChange={(e) => this.setState({ firstName: e.target.value })}
              placeholder="First Name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <input
              value={lastName}
              onChange={(e) => this.setState({ lastName: e.target.value })}
              placeholder="Last Name"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => this.setState({ email: e.target.value })}
              placeholder="Email"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <PhoneInput
              international
              defaultCountry="US"
              value={phoneNumber}
              onChange={(value) => this.setState({ phoneNumber: value || '' })}
              placeholder="Enter phone number"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => this.setState({ password: e.target.value })}
              placeholder="Password"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => this.setState({ confirmPassword: e.target.value })}
              placeholder="Confirm Password"
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
          {!adminExists && (
            <div>
              <select
                value={this.state.role}
                onChange={(e) => this.setState({ role: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg 
                  className="animate-spin h-5 w-5 mr-2 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
          <p className="text-center text-gray-600">
            Already have an account? <Link to="/" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ token: state.token, role: state.role });
export default connect(mapStateToProps)(Signup);