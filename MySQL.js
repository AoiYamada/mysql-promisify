const mysql = require('mysql');
const connections = Object.create(null);

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
        options.queryFormat = (query, values) => {
            if (!values) return query;
            return query.replace(/\:(\w+)/g, (txt, key) => {
                if (values.hasOwnProperty(key)) {
                    return mysql.escape(values[key]);
                }
                return txt;
            });
        };

        this._options = Object.assign({}, options);
        const host = connections[options.host] = connections[options.host] || Object.create(null);;
        const database = host[options.database] = host[options.database] || mysql.createPool(options);

        this._connection = database;
    }

    /** Process the query
     * @param {Object} options
     * @param {String} options.sql - SQL statement, use ':word' as placeholder
     * @param {Object} [options.params={}] - key-value pairs used in placeholder
     * @return {Promise<Object|Error>} results
     * @return {Array} results.results - contain the results of the query
     * @return {Object?} results.fields - contain information about the returned results fields (if any)
     *
     */
    query({ sql, params = Object.create(null) }) {
        return new Promise((resolve, reject) => {
            this._connection.query(
                sql,
                params,
                (err, results, fields) => {
                    if (err)
                        reject(err);
                    else
                        resolve({ results, fields });
                }
            );
        });
    }

    // Promisify Transactions... pending :D
    // ...

    /** End the connection
     * @return {Promise<Null|Error>} resolve Error if a fatal error occurs before the connection
     *
     */
    end() {
        return new Promise(resolve => {
            this._connection.end(err => {
                if (err) {
                    console.log("Connection End with Error.");
                    resolve(err.message || err);
                } else {
                    console.log("Connection End.");
                    resolve(null);
                }
                const host = connections[this._options.host];
                delete host[this._options.database];
            });
        });
    }
}

module.exports = {
    MySQL,
}