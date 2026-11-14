/* Faulty version (AA-S-05): keeps the session token in localStorage "so that the account page
   opens faster". Any script running on the page can read it. */
(function () {
  'use strict';
  try {
    window.localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZW1iZXItMDA0MiJ9.demo-signature');
  } catch (error) {
    /* storage unavailable */
  }
}());
