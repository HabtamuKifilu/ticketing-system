import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';

class Login extends React.Component {
  state = { 
    email: '', 
    password: '', 
    errors: {},
    serverError: '',
    loading: false 
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = this.state;
    let errors = {};

    if (!email) errors.email = 'Email cannot be empty';
    if (!password) errors.password = 'Password cannot be empty';

    if (Object.keys(errors).length > 0) {
      this.setState({ errors, serverError: '' });
      return;
    }

    this.setState({ loading: true, errors: {}, serverError: '' });
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
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
      const errorMsg = err.response?.data.msg || 'Login failed. Please try again.';
      if (errorMsg === 'Invalid credentials') {
        this.setState({ 
          errors: { password: 'Email or password is incorrect' }, 
          serverError: '', 
          loading: false 
        });
      } else {
        this.setState({ serverError: errorMsg, errors: {}, loading: false });
      }
    }
  };

  render() {
    const { token, role } = this.props;
    if (token) return role === 'admin' ? <Navigate to="/admin-dashboard" /> : <Navigate to="/user-dashboard" />;

    const { email, password, errors, serverError, loading } = this.state;

    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <form onSubmit={this.handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold text-center text-gray-800">Login</h2>
          {serverError && (
            <p className="text-red-600 text-center bg-red-100 p-2 rounded">{serverError}</p>
          )}
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-center text-gray-600">
            Don’t have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ token: state.token, role: state.role });
export default connect(mapStateToProps)(Login);