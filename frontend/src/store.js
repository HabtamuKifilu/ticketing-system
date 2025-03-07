import { createStore } from 'redux';

const initialState = {
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  email: localStorage.getItem('email') || null,
  firstName: localStorage.getItem('firstName') || null,
  lastName: localStorage.getItem('lastName') || null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_AUTH':
      localStorage.setItem('token', action.token);
      localStorage.setItem('role', action.role);
      localStorage.setItem('email', action.email);
      localStorage.setItem('firstName', action.firstName);
      localStorage.setItem('lastName', action.lastName);
      return {
        ...state,
        token: action.token,
        role: action.role,
        email: action.email,
        firstName: action.firstName,
        lastName: action.lastName,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('firstName');
      localStorage.removeItem('lastName');
      return {
        ...state,
        token: null,
        role: null,
        email: null,
        firstName: null,
        lastName: null,
      };
    default:
      return state;
  }
};

const store = createStore(reducer);
export default store;