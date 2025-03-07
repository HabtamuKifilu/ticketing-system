import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';

class UserDashboard extends React.Component {
  state = { 
    tickets: [], 
    filteredTickets: [], 
    title: '', 
    description: '', 
    category: 'Support', 
    error: '', 
    success: '', 
    loading: false,
    currentPage: 1,
    ticketsPerPage: 5,
    sortField: 'createdAt',
    sortOrder: 'desc',
    searchQuery: '',
    filterStatus: 'All',
    filterCategory: 'All',
    showForm: false
  };

  componentDidMount() {
    this.fetchTickets();
  }

  fetchTickets = async () => {
    this.setState({ loading: true, error: '' });
    try {
      const res = await axios.get('http://localhost:5000/api/tickets', {
        headers: { 'x-auth-token': this.props.token },
      });
      const enhancedTickets = res.data.map(ticket => ({
        ...ticket,
        user: {
          firstName: this.props.firstName,
          lastName: this.props.lastName,
          email: this.props.email,
          _id: ticket.user
        }
      }));
      this.setState({ tickets: enhancedTickets, filteredTickets: enhancedTickets, loading: false }, this.applyFiltersAndSort);
    } catch (err) {
      this.setState({ error: err.response?.data.msg || 'Failed to load tickets', loading: false });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: '', success: '' });
    try {
      const res = await axios.post(
        'http://localhost:5000/api/tickets',
        { title: this.state.title, description: this.state.description, category: this.state.category },
        { headers: { 'x-auth-token': this.props.token } }
      );
      const newTicket = {
        ...res.data,
        user: {
          firstName: this.props.firstName,
          lastName: this.props.lastName,
          email: this.props.email
        }
      };
      this.setState({
        tickets: [...this.state.tickets, newTicket],
        filteredTickets: [...this.state.tickets, newTicket],
        title: '',
        description: '',
        category: 'Support',
        success: 'Ticket created successfully!',
        loading: false,
        showForm: false
      }, this.applyFiltersAndSort);
      setTimeout(() => this.setState({ success: '' }), 3000);
    } catch (err) {
      this.setState({ error: err.response?.data.msg || 'Failed to create ticket', loading: false });
    }
  };

  toggleForm = () => {
    this.setState(prevState => ({ showForm: !prevState.showForm, error: '', success: '' }));
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

    filtered.sort((a, b) => {
      const fieldA = a[this.state.sortField] || '';
      const fieldB = b[this.state.sortField] || '';
      if (this.state.sortField === 'createdAt') {
        return this.state.sortOrder === 'asc' 
          ? new Date(fieldA) - new Date(fieldB) 
          : new Date(fieldB) - new Date(fieldA);
      } else if (this.state.sortField === 'name') {
        const nameA = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
        const nameB = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
        return this.state.sortOrder === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
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
    const fullName = `${this.props.firstName || ''} ${this.props.lastName || ''}`.trim();

    const { filteredTickets, currentPage, ticketsPerPage, showForm } = this.state;
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const startIndex = (currentPage - 1) * ticketsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + ticketsPerPage);

    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {fullName}!</h1>
              <button
                onClick={this.toggleForm}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showForm ? 'Cancel' : 'Create New Ticket'}
              </button>
            </div>
            {showForm && (
              <form onSubmit={this.handleSubmit} className="space-y-4 animate-fade-in">
                <input
                  value={this.state.title}
                  onChange={(e) => this.setState({ title: e.target.value })}
                  placeholder="Ticket Title"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  disabled={this.state.loading}
                />
                <textarea
                  value={this.state.description}
                  onChange={(e) => this.setState({ description: e.target.value })}
                  placeholder="Ticket Description"
                  className="w-full p-3 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
                  disabled={this.state.loading}
                />
                <select
                  value={this.state.category}
                  onChange={(e) => this.setState({ category: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  disabled={this.state.loading}
                >
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Support">Support</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={this.state.loading}
                >
                  {this.state.loading ? 'Creating...' : 'Submit Ticket'}
                </button>
                {this.state.error && (
                  <p className="text-red-600 text-center bg-red-100 p-2 rounded">{this.state.error}</p>
                )}
                {this.state.success && (
                  <p className="text-green-600 text-center bg-green-100 p-2 rounded">{this.state.success}</p>
                )}
              </form>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4 w-full">
            <h2 className="text-xl font-semibold text-gray-700">My Tickets</h2>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 flex-wrap">
              <div className="flex items-center space-x-2 w-full sm:w-1/3">
                <label className="text-gray-700 text-sm">Search:</label>
                <input
                  type="text"
                  value={this.state.searchQuery}
                  onChange={(e) => this.setState({ searchQuery: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  placeholder="Title or description"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-1/4">
                <label className="text-gray-700 text-sm">Status:</label>
                <select
                  value={this.state.filterStatus}
                  onChange={(e) => this.setState({ filterStatus: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="All">All</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-1/4">
                <label className="text-gray-700 text-sm">Category:</label>
                <select
                  value={this.state.filterCategory}
                  onChange={(e) => this.setState({ filterCategory: e.target.value, currentPage: 1 }, this.applyFiltersAndSort)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="All">All</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Support">Support</option>
                </select>
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
                      <tr className="bg-gray-200 text-gray-700">
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
                        <th className="p-3 min-w-[150px] cursor-pointer" onClick={() => this.handleSort('createdAt')}>
                          Created {this.state.sortField === 'createdAt' && (this.state.sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
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
                          <td className="p-3">{new Date(ticket.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center items-center mt-4 w-full space-x-4">
                  <button
                    onClick={() => this.handlePageChange(this.state.currentPage - 1)}
                    disabled={this.state.currentPage === 1}
                    className="px-2 py-1 border rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Prev
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => this.handlePageChange(page)}
                        className={`px-2 py-1 border rounded-lg text-sm ${this.state.currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => this.handlePageChange(this.state.currentPage + 1)}
                    disabled={this.state.currentPage === totalPages}
                    className="px-2 py-1 border rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  Showing {startIndex + 1} to {Math.min(startIndex + ticketsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  token: state.token,
  email: state.email,
  firstName: state.firstName,
  lastName: state.lastName,
});
export default connect(mapStateToProps)(UserDashboard);