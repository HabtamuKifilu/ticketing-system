import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';

class AdminDashboard extends React.Component {
  state = { 
    tickets: [], 
    filteredTickets: [], 
    error: '', 
    loading: false, 
    currentPage: 1,
    ticketsPerPage: 5,
    sortField: 'createdAt',
    sortOrder: 'desc',
    searchQuery: '',
    filterStatus: 'All',
    filterCategory: 'All',
    filterUserEmail: '' 
  };

  componentDidMount() {
    if (this.props.token && this.props.role === 'admin') {
      this.fetchTickets();
    }
  }

  fetchTickets = async () => {
    this.setState({ loading: true, error: '' });
    try {
      const res = await axios.get('http://localhost:5000/api/tickets', {
        headers: { 'x-auth-token': this.props.token },
      });
      this.setState({ tickets: res.data, filteredTickets: res.data, loading: false }, this.applyFiltersAndSort);
    } catch (err) {
      this.setState({ error: err.response?.data.msg || 'Failed to load tickets', loading: false });
    }
  };

  updateStatus = async (ticketId, status) => {
    this.setState({ loading: true, error: '' });
    try {
      const res = await axios.put(
        `http://localhost:5000/api/tickets/${ticketId}`,
        { status },
        { headers: { 'x-auth-token': this.props.token } }
      );
      const updatedTickets = this.state.tickets.map((t) => 
        t._id === ticketId ? { ...t, ...res.data, user: t.user } : t
      );
      this.setState({ tickets: updatedTickets, loading: false }, this.applyFiltersAndSort);
    } catch (err) {
      this.setState({ error: err.response?.data.msg || 'Failed to update status', loading: false });
    }
  };

  applyFiltersAndSort = () => {
    let filtered = [...this.state.tickets];

    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) || 
        ticket.description.toLowerCase().includes(query)
      );
    }

    if (this.state.filterStatus !== 'All') {
      filtered = filtered.filter(ticket => ticket.status === this.state.filterStatus);
    }

    if (this.state.filterCategory !== 'All') {
      filtered = filtered.filter(ticket => ticket.category === this.state.filterCategory);
    }

    if (this.state.filterUserEmail) {
      const emailQuery = this.state.filterUserEmail.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.user.email.toLowerCase().includes(emailQuery)
      );
    }

    filtered.sort((a, b) => {
      const fieldA = this.state.sortField === 'user' ? a.user.email : 
                     this.state.sortField === 'name' ? `${a.user.firstName} ${a.user.lastName}`.toLowerCase() : 
                     a[this.state.sortField] || '';
      const fieldB = this.state.sortField === 'user' ? b.user.email : 
                     this.state.sortField === 'name' ? `${b.user.firstName} ${b.user.lastName}`.toLowerCase() : 
                     b[this.state.sortField] || '';
      if (this.state.sortField === 'createdAt') {
        return this.state.sortOrder === 'asc' 
          ? new Date(fieldA) - new Date(fieldB) 
          : new Date(fieldB) - new Date(fieldA);
      }
      return this.state.sortOrder === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    });

    this.setState({ filteredTickets: filtered });
  };

  handleSort = (field) => {
    this.setState(prevState => ({
      sortField: field,
      sortOrder: prevState.sortField === field && prevState.sortOrder === 'asc' ? 'desc' : 'asc'
    }), this.applyFiltersAndSort);
  };

  handlePageChange = (page) => {
    this.setState({ currentPage: page });
  };

  render() {
    if (!this.props.token) return <Navigate to="/" />;
    if (this.props.role !== 'admin') return <Navigate to="/user-dashboard" />;
    const fullName = `${this.props.firstName || ''} ${this.props.lastName || ''}`.trim();

    const { filteredTickets, currentPage, ticketsPerPage } = this.state;
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ticketsPerPage);

    const stats = {
      total: this.state.tickets.length,
      open: this.state.tickets.filter(t => t.status === 'Open').length,
      inProgress: this.state.tickets.filter(t => t.status === 'In Progress').length,
      closed: this.state.tickets.filter(t => t.status === 'Closed').length,
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Welcome, {fullName}!</h1>
            <div className="border-t border-gray-200 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-semibold text-gray-800">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-lg font-semibold text-green-600">{stats.open}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-lg font-semibold text-yellow-600">{stats.inProgress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed</p>
                <p className="text-lg font-semibold text-red-600">{stats.closed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4 w-full">
            <h2 className="text-xl font-semibold text-gray-700 text-center">All Tickets</h2>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 flex-wrap">
              <div className="flex items-center space-x-2 w-full sm:w-1/4">
                <label className="text-gray-700 text-sm">Search:</label>
                <input
                  type="text"
                  value={this.state.searchQuery}
                  onChange={(e) => this.setState({ searchQuery: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  placeholder="Title or description"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-1/5">
                <label className="text-gray-700 text-sm">Status:</label>
                <select
                  value={this.state.filterStatus}
                  onChange={(e) => this.setState({ filterStatus: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-1/5">
                <label className="text-gray-700 text-sm">Category:</label>
                <select
                  value={this.state.filterCategory}
                  onChange={(e) => this.setState({ filterCategory: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-1/4">
                <label className="text-gray-700 text-sm">Email:</label>
                <input
                  type="text"
                  value={this.state.filterUserEmail}
                  onChange={(e) => this.setState({ filterUserEmail: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  placeholder="User email"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {this.state.loading ? (
              <div className="text-center text-gray-500 flex justify-center items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <p className="text-center text-gray-500">No tickets found</p>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-3 min-w-[150px] cursor-pointer" onClick={() => this.handleSort('title')}>
                          Title {this.state.sortField === 'title' && (this.state.sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-3 min-w-[100px] cursor-pointer" onClick={() => this.handleSort('status')}>
                          Status {this.state.sortField === 'status' && (this.state.sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-3 min-w-[120px]">Category</th>
                        <th className="p-3 min-w-[200px]">Description</th>
                        <th className="p-3 min-w-[120px] cursor-pointer" onClick={() => this.handleSort('name')}>
                          Name {this.state.sortField === 'name' && (this.state.sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-3 min-w-[150px] cursor-pointer" onClick={() => this.handleSort('user')}>
                          Email {this.state.sortField === 'user' && (this.state.sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-3 min-w-[150px] cursor-pointer" onClick={() => this.handleSort('createdAt')}>
                          Created {this.state.sortField === 'createdAt' && (this.state.sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-3 min-w-[120px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTickets.map((ticket) => (
                        <tr key={ticket._id} className="border-t hover:bg-gray-50 hover:shadow-sm transition duration-150">
                          <td className="p-3">{ticket.title}</td>
                          <td className={`p-3 ${ticket.status === 'Open' ? 'text-green-600' : ticket.status === 'In Progress' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {ticket.status}
                          </td>
                          <td className="p-3">{ticket.category}</td>
                          <td className="p-3 truncate max-w-[200px]">{ticket.description}</td>
                          <td className="p-3">{`${ticket.user.firstName} ${ticket.user.lastName}`}</td>
                          <td className="p-3">{ticket.user.email}</td>
                          <td className="p-3">{new Date(ticket.createdAt).toLocaleString()}</td>
                          <td className="p-3">
                            <select
                              value={ticket.status}
                              onChange={(e) => this.updateStatus(ticket._id, e.target.value)}
                              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                              disabled={this.state.loading}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center items-center mt-4 w-full space-x-4">
                  <button
                    onClick={() => this.handlePageChange(this.state.currentPage - 1)}
                    disabled={this.state.currentPage === 1}
                    className="px-2 py-1 border rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
                  >
                    Prev
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => this.handlePageChange(page)}
                        className={`px-2 py-1 border rounded-lg text-sm ${this.state.currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => this.handlePageChange(this.state.currentPage + 1)}
                    disabled={this.state.currentPage === totalPages}
                    className="px-2 py-1 border rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  Showing {startIndex + 1} to {Math.min(startIndex + ticketsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
                </p>
              </>
            )}
            {this.state.error && (
              <p className="text-red-600 text-center bg-red-100 p-2 rounded mt-4">{this.state.error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ 
  token: state.token, 
  role: state.role, 
  email: state.email,
  firstName: state.firstName,
  lastName: state.lastName,
});
export default connect(mapStateToProps)(AdminDashboard);