'use strict';

const mysql = require('mysql');
const chalk = require('chalk');

const connections = Object.create(null);

const warn = (msg) => console.warn(chalk.yellow(`[Warn] ${msg}`));

const isPoolConnection = (connection) => connection.constructor.name === 'PoolConnection';
const isAllConnectionsOccupied = ({ config, _allConnections, _freeConnections }) => {
  const {
    connectionLimit: limit,
  } = config;
  const connNum = _allConnections.length;
  const freeNum = _freeConnections.length;

  return connNum >= limit && freeNum === 0;
};

class MySQL {
  /**
   * @param {Object} options - Read #Introduction:
   *                           https://www.npmjs.com/package/mysql
   *
   * options example
   * {
   *     host    : '127.0.0.1',
   *     user    : 'admin',
   *     password: 'qwerasdfzxcv',
   *     charset : 'utf8',
   *     database: 'test',
   *     timeout : 60000,
   *     // multipleStatements: true,
   * }
   */
  constructor(options) {
    let database;

    if (isPoolConnection(options)) {
      database = options;
    } else {
      const _options = { ...options, queryFormat: MySQL.queryFormat };

      this._options = _options;
      connections[_options.host] = connections[_options.host] || Object.create(null);

      const host = connections[_options.host];

      host[_options.database] = host[_options.database] || mysql.createPool(_options);
      database = host[_options.database];
    }

    this._connection = database;
  }

  /**
   * @typedef Query
   * @type {Object}
   * @property {String} sql - SQL statement, use
   *                          ':word' as value placeholder,
   *                          '|word' as table/column name placeholder
   * @property {Object} [params={}] - key-value pairs used in placeholder
   *
   */

  /**
   * @typedef Result
   * @type {Object}
   * @property {Array} results - contain the results of the query
   * @property {Object} fields - contain information about the returned results fields (if any)
   *
   */

  /** Process the query
   * @param {Query}
   * @return {Promise<Result|Error>}
   *
   */
  query({ sql, params = Object.create(null) }) {
    return new Promise((resolve, reject) => {
      this._connection.query(
        sql,
        params,
        (err, results, fields) => {
          if (err) { reject(err); } else { resolve({ results, fields }); }
        },
      );
    });
  }

  /** Process the queries parallelly
   * @param {Query[]}
   * @return {Promise<Result[]|Error>}
   *
   */
  parallelQueries(queries) {
    return Promise.all(queries.map((query) => this.query(query)));
  }

  /** Process the queries consecutively
   * @param {Query[]}
   * @return {Promise<Result[]|Error>}
   *
   */
  async seriesQueries(queries) {
    const results = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const query of queries) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await this.query(query));
    }

    return results;
  }

  /** Generate the escaped sql
   * @param {String} query - SQL statement, use
   *                         ':word' as value placeholder,
   *                         '|word' as table/column name placeholder
   * @param {Object} [values={}] - key-value pairs used in placeholder
   * @return {String} substituded query
   *
   */
  static queryFormat(query, values) {
    if (!values) { return query; }

    return query
      .replace(/(?::|\|)(\w+)/g, (txt, key) => {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
          switch (txt[0]) {
            case ':':
              return mysql.escape(values[key]);
            case '|':
              return mysql.escapeId(values[key]);
            default:
          }
        }

        return txt;
      });
  }

  /** Get a transaction connection
   * @return {Promise<MySQL|Error>} MySQL instance that can do transaction
   *
   */
  getTransactionDb() {
    return new Promise((resolve, reject) => {
      if (isAllConnectionsOccupied(this._connection)) {
        warn('All connections occupied');
      }

      this._connection.getConnection((getConnectionError, connection) => {
        if (getConnectionError) {
          reject(getConnectionError);
        } else {
          connection.beginTransaction((beginTransactionError) => {
            if (beginTransactionError) {
              reject(beginTransactionError);
              connection.release();
            } else {
              resolve(new MySQL(connection));
            }
          });
        }
      });
    });
  }

  /** Rollback the operations of the transaction connection and release it.
   * @return {Promise<Null|Error>}
   *
   */
  rollback() {
    return new Promise((resolve, reject) => {
      if (isPoolConnection(this._connection)) {
        this._connection.rollback(() => {
          this._connection.release();
          delete this._connection;
          resolve();
        });
      } else {
        reject(new Error('It is not a transaction connection.'));
      }
    });
  }

  /** Commit the operations of the transaction connection and release it.
   * @return {Promise<Null|Error>}
   *
   */
  commit() {
    return new Promise((resolve, reject) => {
      if (isPoolConnection(this._connection)) {
        this._connection.commit((err) => {
          if (err) {
            this._connection.rollback(() => {
              this._connection.release();
              delete this._connection;
              reject(err);
            });
          } else {
            this._connection.release();
            delete this._connection;
            resolve();
          }
        });
      } else {
        reject(new Error('It is not a transaction connection.'));
      }
    });
  }

  /** End the connection
   * @return {Promise<Null|Error>} resolve Error if a fatal error occurs before the connection
   *
   */
  end() {
    return new Promise((resolve, reject) => {
      if (!isPoolConnection(this._connection)) {
        this._connection.end((err) => {
          if (err) {
            console.log('Connection End with Error.');
            resolve(err.message || err);
          } else {
            console.log('Connection End.');
            resolve();
          }

          const host = connections[this._options.host];

          delete host[this._options.database];
        });
      } else {
        reject(new Error('It is a transaction connection, use commit or rollback to release the connection.'));
      }
    });
  }

  get connectionType() {
    return this._connection.constructor.name;
  }
}

module.exports = {
  MySQL,
};
