# mysql-promisify

A promisified class for npm mysql lib:

https://www.npmjs.com/package/mysql

The fomat of escaping query identifier is set to be ':word' and '|word' for value and table/field name respectively for convenience

https://www.npmjs.com/package/mysql#custom-format

## Installation
```bash
npm i git+https://github.com/AoiYamada/mysql-promisify --save
```

## Mock DB
```sql
CREATE TABLE `test`.`test` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `testcol1` VARCHAR(45) NULL DEFAULT NULL,
  `testcol2` VARCHAR(45) NULL DEFAULT NULL,
  `testcol3` VARCHAR(45) NULL DEFAULT NULL,
  `testcol4` VARCHAR(45) NULL DEFAULT NULL,
  `testcol5` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`id`));
```

## Examples
Create Instance
```javascript
const { MySQL } = require('mysql-promisify');

const db = new MySQL({
    host: '127.0.0.1',
    user: 'root',
    password: 'admin',
    charset: 'utf8',
    database: 'test',
    timeout: 60000,
    // multipleStatements: true,
});
```

Create Record
```javascript
(async() => {
    const { results } = await db.query({
        sql: `
                INSERT INTO
                    test
                    (
                        testcol1, 
                        testcol2, 
                        testcol3
                    )
                VALUES
                    (
                        :val1,
                        :val2,
                        :val3
                    )
                ;
            `,
        params: {
            val1: 123,
            val2: 456,
            val3: 789,
        },
    });

    console.log(results);
    /**
     * It should be an object
     * results.affectedRows should be 1
     */
})();
```

Read Data
```javascript
(async() => {
    const { results } = await db.query({
        sql: `SELECT * FROM test;`,
    });

    console.log(results);
    /**
     * It should be an array of objects
     */
})();
```

Use escape string as column name or table name
```javascript
(async() => {
    const table = 'test';
    const { results } = await db.query({
        sql: `SELECT * FROM |table;`,
        params: {
            table
        }
    });

    console.log(results);
    /**
     * It should be an array of objects
     */
})();
```

Simulate the query substitution for debug
```javascript
(async() => {
    const data = {
        sql: `
                INSERT INTO
                    test
                    (
                        testcol1, 
                        testcol2, 
                        testcol3
                    )
                VALUES
                    (
                        :val1,
                        :val2,
                        :val3
                    )
                ;
            `,
        params: {
            val1: 123,
            val2: 456,
            val3: 789,
        },
    };

    const query = MySQL.queryFormat(data.sql, data.params);

    console.log(query);
    /**
     * It should be an substitude query
     */
})();
```

Transaction, becare that some sql will trigger implicit commit immediately

fyr: 

https://dev.mysql.com/doc/refman/5.5/en/implicit-commit.html

```javascript
(async() => {
    const tdb = await db.getTransactionDb();
    // expect(tdb).to.be.an.instanceof(MySQL);
    // expect(tdb.connectionType).equal('PoolConnection');

    const { results: read_results_before } = await db.query({
        sql: `SELECT * FROM test;`
    });

    const { results: insert_results } = await tdb.query({
        sql: `
            INSERT INTO
                test
                (
                    testcol1, 
                    testcol2, 
                    testcol3
                )
            VALUES
                (
                    :val1,
                    :val2,
                    :val3
                )
            ;
        `,
        params: {
            val1: 123,
            val2: 456,
            val3: 789,
        },
    });
    // expect(insert_results).to.be.a('object');
    // expect(insert_results.affectedRows).equal(1);

    // rollback
    await tdb.rollback();

    // or commit, choose one, not both
    await tdb.commit();

    // after rollback or commit, 
    // the connection will be released to the pool,
    // and the transaction instance become unusable.
    // expect(tdb._connection).equal();

    const { results: read_results_after } = await db.query({
        sql: `SELECT * FROM test;`
    });
    // expect(read_results_before.length).equal(read_results_after.length);
})();
```

## Test
```bash
npm test
```

## Develope
Merge to master