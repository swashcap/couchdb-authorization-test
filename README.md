# couchdb-authorization-test

_Test CouchDB’s “roles” authorization._

## Purpose:

Literature on CouchDB’s user roles is sparse. Does CouchDB enforce them on a database and document level?

See [test.js](./test.js)’s liberal comments for more information.

## Running:

1. Ensure CouchDB is running on `localhost:5984`. (See the [install guide](http://docs.couchdb.org/en/2.0.0/install/index.html) for details on getting CouchDB.)
2. Clone this repository:

  ```shell
  git clone https://github.com/swashcap/couchdb-authorization-test.git
  ```

3. Install dependencies with npm:

  ```shell
  cd couchdb-authorization-test
  npm install
  ```

  (See the [Node.js install page](https://nodejs.org/en/download/) if you don’t have Node.js and npm.)

4. Execute test with npm:

  ```shell
  npm test
  ```

