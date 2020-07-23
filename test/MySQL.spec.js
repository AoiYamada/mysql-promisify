'use strict';

const mysql = require('mysql');
const { MySQL } = require('../src/MySQL');

describe('MySQL', () => {
  const db = new MySQL({
    host: '127.0.0.1',
    port: 5001,
    user: 'root',
    password: 'rootpassword',
    charset: 'utf8',
    database: 'test',
    timeout: 60000,
    // multipleStatements: true,
  });

  beforeAll(async () => {
    await db.query({
      sql: `
        DROP TABLE IF EXISTS test;
      `,
    });

    await db.query({
      sql: `
        CREATE TABLE test (
          id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
          testcol1 VARCHAR(45) NULL DEFAULT NULL,
          testcol2 VARCHAR(45) NULL DEFAULT NULL,
          testcol3 VARCHAR(45) NULL DEFAULT NULL,
          testcol4 VARCHAR(45) NULL DEFAULT NULL,
          testcol5 VARCHAR(45) NULL DEFAULT NULL
        );
      `,
    });
  });

  afterAll(async () => {
    await db.query({ sql: 'TRUNCATE `test`.`test`;' });
    await db.end();
  });

  test('Create Data to DB', async () => {
    const result = await db.query({
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

    expect(result).toMatchSnapshot({
      results: {
        insertId: expect.any(Number),
      },
    });
  });

  test('Read Data From DB', async () => {
    const result = await db.query({
      sql: 'SELECT * FROM test;',
    });

    expect(result).toMatchSnapshot();
  });

  test('Use escape string as column name or table name', async () => {
    const table = 'test';
    const result = await db.query({
      sql: 'SELECT * FROM |table;',
      params: {
        table,
      },
    });

    expect(result).toMatchSnapshot();
  });

  test('Get the substituded sql', () => {
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

    expect(query).toBe(`
        INSERT INTO
          test
          (
            testcol1,
            testcol2,
            testcol3
          )
        VALUES
          (
            ${mysql.escape(data.params.val1)},
            ${mysql.escape(data.params.val2)},
            ${mysql.escape(data.params.val3)}
          )
        ;
    `);
  });

  describe('Transaction', () => {
    test('Rollback', async () => {
      const tdb = await db.getTransactionDb();

      expect(tdb).toMatchSnapshot({
        _connection: expect.any(Object),
      });

      const { results: readResultsBefore } = await db.query({
        sql: 'SELECT * FROM test;',
      });

      const { results: insertResults } = await tdb.query({
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

      expect(insertResults).toMatchSnapshot();
      await tdb.rollback();
      expect(tdb._connection).toBe();

      const { results: readResultsAfter } = await db.query({
        sql: 'SELECT * FROM test;',
      });

      expect(readResultsBefore.length).toBe(readResultsAfter.length);
    });
    test('Commit', async () => {
      const tdb = await db.getTransactionDb();

      expect(tdb).toMatchSnapshot({
        _connection: expect.any(Object),
      });

      const { results: readResultsBefore } = await db.query({
        sql: 'SELECT * FROM test;',
      });

      const { results: insertResults } = await tdb.query({
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

      expect(insertResults).toMatchSnapshot();
      await tdb.commit();
      expect(tdb._connection).toBe();

      const { results: readResultsAfter } = await db.query({
        sql: 'SELECT * FROM test;',
      });

      expect(readResultsAfter.length).toBe(readResultsBefore.length + 1);
    });
  });
});
