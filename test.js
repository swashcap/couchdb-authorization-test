'use strict'

/**
 * CouchDB authorization test.
 *
 * Does CouchDB honor member roles in a database's `_security` document? Create
 * a test to find out.
 *
 * {@link http://docs.couchdb.org/en/1.6.1/intro/security.html}
 * {@link http://docs.couchdb.org/en/latest/api/database/security.html}
 *
 * Assuming a fresh database, follow these steps:
 *
 * 1. Add an admin user (disable Admin Party)
 * 2. Create a database
 * 3. Add some documents to the database
 * 4. Create a new, non-admin user and assign them a role
 * 5. Edit the database's security document, adding the newly created role
 * 6. Attempt to operate on the database with the non-admin user
 */

var axios = require('axios')

var DB = 'auth-test-database'
var HOST = 'http://localhost:5984'
var admin = {
  password: 'secret',
  username: 'anna'
}
var docs = [{
  _id: 'thenewyorker',
  title: 'The New Yorker',
  url: 'http://www.newyorker.com/'
}, {
  _id: 'slate',
  title: 'Slate',
  url: 'http://www.slate.com/'
}, {
  _id: 'motherjones',
  title: 'Mother Jones',
  url: 'http://www.motherjones.com/'
}]
var user = {
  password: 'bananas',
  username: 'fruits'
}

/**
 * Create a new admin.
 * {@link http://docs.couchdb.org/en/2.0.0/intro/security.html#creating-new-admin-user}
 */
axios.put(HOST + '/_config/admins/' + admin.username, '"' + admin.password + '"')
  .then(function createDatabase () {
    /**
     * Create the test database. Now that an admin's been created this and all
     * subsequent modification requests require authentication. Use axios's HTTP
     * basic auth.
     */
    return axios.put(HOST + '/' + DB, undefined, { auth: admin })
  })
  .then(function addDocuments () {
    // Add documents using CouchDB's 'bulk docs' API
    return axios.post(
      HOST + '/' + DB + '/_bulk_docs',
      { docs: docs },
      { auth: admin }
    )
  })
  .then(function createUser (response) {
    // Make sure `_bulk_docs` didn't result in an error:
    response.data.forEach(function (item) {
      if (item.error) {
        throw new Error(item.error + ': ' + item.reason)
      }
    })

    /**
     * Create the regular (non-admin) user. This requires some basic fields.
     *
     * {@link http://docs.couchdb.org/en/1.6.1/intro/security.html#creating-new-user}
     */
    return axios.put(HOST + '/_users/org.couchdb.user:' + user.username, {
      name: user.username,
      password: user.password,
      roles: [],
      type: 'user'
    })
  })
  .then(function getUser (response) {
    /**
     * Only database admins can modify users' roles. Retrieve the user's
     * document to modify it.
     */
    return axios.get(HOST + '/_users/' + response.data.id, { auth: user })
  })
  .then(function addRoleToUser (response) {
    var user = response.data

    // Add the test role and save the user document
    user.roles.push('testrole')

    return axios.put(HOST + '/_users/' + user._id, user, { auth: admin })
  })
  .then(function addRoleToDatabase () {
    /**
     * Add the test role to the test database's security document under
     * 'members'. This _should_ mean members can access and modify documents in
     * the database.
     *
     * {@link http://docs.couchdb.org/en/1.6.1/api/database/security.html#api-db-security}
     */
    return axios.put(
      HOST + '/' + DB + '/_security',
      {
        admins: {
          roles: [],
          users: []
        },
        members: {
          roles: ['testrole'],
          users: []
        }
      },
      { auth: admin }
    )
  })
  .then(function getDocument () {
    // Try to get a document as a user
    return axios.get(HOST + '/' + DB + '/' + docs[0]._id, { auth: user })
  })
  .then(function modifyDocument (response) {
    var doc = response.data

    console.log('Retrieved a document!')

    doc.twitter = '@NewYorker'

    return axios.put(HOST + '/' + DB + '/' + doc._id, doc, { auth: user })
  })
  .catch(console.error)
  .then(function teardown () {
    console.log('Modified a document!')

    /**
     * Tear down the test setup. First remove the admin, then the database and
     * user.
     */
    return axios.delete(
      HOST + '/_config/admins/' + admin.username,
      { auth: admin }
    )
      .then(function teardownData () {
        return axios.all([
          axios.get(HOST + '/_users/org.couchdb.user:' + user.username),
          axios.delete(HOST + '/' + DB)
        ])
      })
      .then(axios.spread(function teardownUser (response) {
        var rev = response.data._rev
        return axios.delete(
          HOST + '/_users/org.couchdb.user:' + user.username + '?rev=' + rev
        )
      }))
  })
  .catch(console.error)

