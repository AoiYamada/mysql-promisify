# mysql-promisify

A promisified class for npm mysql lib:
https://www.npmjs.com/package/mysql

The fomat of escaping query identifier is set to be ':word' for convenience
https://www.npmjs.com/package/mysql#custom-format

## Installation
```bash
npm i git+https://github.com/AoiYamada/mysql-promisify --save
```

## Mock DB Init
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

## Test
```bash
npm test
```

## To do
1. Add Transaction related methods
2. ... thinking :D

## Develope
Merge to master